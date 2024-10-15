import React, { useState } from "react";

const SignerVerification: React.FC<{
  onSetSignerAddress: (address: string) => void;
  serviceName: string;
}> = ({ onSetSignerAddress, serviceName }) => {
  const [reportContentValue, setReportContentValue] = useState<string>();

  const handleDownloadReport = () => {
    fetch(
      `http://192.168.2.142:8080/v1/proxy/${serviceName}/attestation/report`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    )
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
        // reportContent.textContent = JSON.stringify(data, null, 2);
        setReportContentValue(JSON.stringify(data, null, 2));
      })
      .catch((error) => {
        setReportContentValue("Error: " + error.message);
        // reportContent.textContent = "Error: " + error.message;
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
                curl -X GET http://192.168.2.142:8080/v1/proxy/
                {serviceName}
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
                  {/* <pre id="reportContent">No results yet.</pre> */}
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
