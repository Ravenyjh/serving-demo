import React, { useState } from "react";
import {
  ZGServingUserBroker,
  SingerRAVerificationResult,
} from "@0glabs/0g-serving-broker";

const SignerVerification: React.FC<{
  onSetSignerAddress: (address: string) => void;
  processor: Promise<ZGServingUserBroker> | null;
  providerAddress: string;
  serviceName: string;
  url: string;
}> = ({ onSetSignerAddress, processor, providerAddress, serviceName, url }) => {
  const [reportContentValue, setReportContentValue] = useState<string>();
  const [verifiedResult, setVerifiedResult] =
    useState<SingerRAVerificationResult>();

  const handleGetAndVerify = async () => {
    const result = await (
      await processor
    )?.verifier.getAndVerifySigningAddress(providerAddress, serviceName);

    if (result) {
      onSetSignerAddress(result.signingAddress);
      setVerifiedResult(result);
    }
  };

  const handleDownloadReport = () => {
    fetch(`${url}/v1/proxy/${serviceName}/attestation/report`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        return response.json();
      })
      .then((data) => {
        if (data.nvidia_payload) {
          try {
            data.nvidia_payload = JSON.parse(data.nvidia_payload);
          } catch (e) {
            console.error("Failed to parse nvidia_payload:", e);
          }
        }
        onSetSignerAddress(data.signing_address);
        setReportContentValue(JSON.stringify(data, null, 2));
      })
      .catch((error) => {
        setReportContentValue("Error: " + error.message);
      });
  };

  return (
    <>
      {/* 3. Verify service signer */}
      <div style={{ borderBottom: "1px solid #ccc", margin: "20px 0" }} />
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "left",
        }}
      >
        <h2>3. Verify Service Signer</h2>
        <>
          <h3 id="option-one">(a) Option One</h3>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              marginLeft: "35px",
            }}
          >
            <p>
              The marketplace backend automatically (a) downloads the
              attestation report (b) verify it in the background.
            </p>

            <button
              style={{
                width: "150px",
                marginTop: "20px",
                marginRight: "10px",
              }}
              type="submit"
              onClick={() => handleGetAndVerify()}
            >
              Try
            </button>

            <>
              {verifiedResult ? (
                <div id="verifiedResult">
                  <h4>Signing Address:</h4>
                  <div> {verifiedResult?.signingAddress}</div>
                </div>
              ) : (
                ""
              )}
            </>
          </div>

          <h3 id="option-two">(b) Option Two</h3>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              marginLeft: "35px",
            }}
          >
            Customer verifies on the official website themselves.
            <h3 id="request">
              (i) Download Attestation Report (get signer address)
            </h3>
            <pre style={{ marginLeft: "25px" }}>
              <code>
                curl -X GET {url || "${url}"}/v1/proxy/
                {serviceName || "${serviceName}"}
                /attestation/report
              </code>
              <div>
                <button
                  style={{
                    width: "150px",
                    marginTop: "20px",
                    marginRight: "10px",
                  }}
                  type="submit"
                  onClick={() => handleDownloadReport()}
                >
                  Try
                </button>

                <div id="reportResult">
                  <h3>Result:</h3>
                  <textarea
                    id="reportContent"
                    rows={4}
                    cols={50}
                    value={reportContentValue}
                    readOnly
                  />
                </div>
              </div>
            </pre>
            <h3 id="verify-the-attestation">(ii) Verify the Attestation</h3>
            <pre style={{ marginLeft: "25px" }}>
              <a
                href="https://docs.attestation.nvidia.com/api-docs/nras.html#tag--GPU-Attestation-API"
                target="_blank"
                rel="noopener noreferrer"
              >
                https://docs.attestation.nvidia.com/api-docs/nras.html#tag--GPU-Attestation-API
              </a>
            </pre>
          </div>
        </>
      </div>
    </>
  );
};

export default SignerVerification;
