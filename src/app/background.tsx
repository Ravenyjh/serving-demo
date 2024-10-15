




import React from "react";

const BackGround: React.FC = () => {
  return (
    <>
      <div
        style={{
          display: "flex",
          padding: "20px",
          backgroundColor: "#ffffff",
          flexDirection: "column",
        }}
      >
        <h1>Project Introduction</h1>
        <p>
          1. 0G Serving System is a DApp that connects providers with AI models
          or hardware to users of AI services through an AI service marketplace.
          <br />
          2. Users can freely choose services registered on the platform by
          providers, and providers can freely set prices for their services. The
          0G Serving System system offers service verification and billing
          functions.
          <br />
          <br />
          Current Stage: Providers offer AI inference services.
        </p>
      </div>

      {/* <div
        style={{
          display: "flex",
          padding: "20px",
          backgroundColor: "#ffffff",
          flexDirection: "column",
        }}
      >
        <h1>Design</h1>
        <>
          <p>
            <strong>Charging Design</strong>:
          </p>
          <ol>
            <li>
              The provider registers the types of services they offer and the
              price for each type within a smart contract.
            </li>
            <li>
              When a user wants to access a service, they need to deposit a
              certain amount of funds into the provider&apos;smart contract.
            </li>
            <li>
              Users can send requests to the provider, and the provider decides
              whether to respond based on whether the remaining balance is
              sufficient.
            </li>
            <li>Each request signed by the user.</li>
            <li>
              The provider can send the request logs with user signatures to the
              smart contract for settlement at any time.
            </li>
            <li>
              Users can verify each response, and if verification fails, they
              can decide to stop sending further requests.
            </li>
            <li>
              Providers need to handle more user requests to settle in batches.
            </li>
            <li>
              Users can request refunds, and after a certain time window, they
              can receive refunds (the time window is to ensure that the user's
              account has a balance when the provider settles). The contract
              owner can update the refund time window.
            </li>
            <li>
              Introduce zk-proof mechanisms to optimize on-chain settlement
              costs by organizing request logs as proof inputs for the smart
              contract settlement.
            </li>
          </ol>
          <p>
            <strong>Verification Implementation</strong>:
          </p>
          <ol>
            <li>
              The provider&apos;inference service runs within a Trusted Execution
              Environment (TEE).
            </li>
            <li>
              Within the TEE environment, a signer component generates a key
              pair, and the public key is included in a Remote Attestation (RA)
              when the provider registers the service, which is available for
              the user to obtain.
            </li>
            <li>
              The provider&apos;service responses are signed with the private key.
            </li>
            <li>
              The user verifies the RA to ensure that the public key originates
              from the TEE and that the private key is not exposed outside the
              TEE.
            </li>
            <li>
              The user verifies the signature of the response using the public
              key to ensure the response originates from the TEE.
            </li>
          </ol>
        </>
      </div> */}

      <div
        style={{
          display: "flex",
          padding: "20px",
          backgroundColor: "#ffffff",
          flexDirection: "column",
        }}
      >
        <h1>Architecture</h1>
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
          }}
        >
          <img
            style={{
              padding: "20px",
              display: "flex",
            }}
            src="/serving-overview.png"
            width="1200px"
          />
          <div
            style={{
              alignSelf: "flex-start",
              display: "flex",
              padding: "20px",
              flex: "0 0 40%",
              overflowY: "auto",
              maxHeight: "50vh",
              flexDirection: "column",
            }}
          >
            <p>
              <strong>Basic Components of 0G Serving System:</strong>
            </p>
            <ol>
              <li>Contract.</li>
              <li>0G Marketplace (User Broker).</li>
              <li>Provider Broker.</li>
              <li>LLM Service (prepared by the provider).</li>
            </ol>
            <p>
              <strong>Deployment Locations:</strong>
            </p>
            <ol>
              <li>The Contract is deployed on the 0G blockchain.</li>
              <li>
                The 0G Marketplace is a purely front-end platform, hosted by the
                0G team, and runs in the customer&apos;browser.
              </li>
              <li>
                The Provider Broker and LLM Service run on the provider&apos;own
                servers.
                <ol>
                  <li>
                    The Provider Broker runs in a container, with an image
                    provided by the 0G team.
                  </li>
                  <li>
                    The LLM Service is managed by the provider and can be run in
                    any form as long as it adheres to the 0G Serving System
                    protocol.
                  </li>
                </ol>
              </li>
            </ol>
            <p>
              <strong>Contract Responsibilities:</strong>
            </p>
            <ol>
              <li>Control of Fund Flow in a 0G System</li>
              <ol>
                <li>
                  How a User can create an account, how to top up, how to
                  request a refund, and the conditions required for a refund.
                </li>
                <li>
                  How a Provider can settle payments, how to determine if a
                  settlement voucher is valid, and from which account should
                  funds be deducted if successful.
                </li>
              </ol>
              <li>Control the Provider&apos;service registration logic. </li>
              <li>
                Stores critical variables during the serving process, such as
                account information (user address, provider address, balance,
                etc.) and service information (names, URLs, etc.).
              </li>
            </ol>
            <p>
              <strong>0G Marketplace Responsibilities:</strong>
            </p>
            <ol>
              <li>Checks available services.</li>
              <li>
                Manages provider accounts by registering, checking, depositing
                to, and requesting refunds from them.
              </li>
              <li>
                Verifies the service&apos;signer RA (the first step in service
                verification)
              </li>
              <li>
                Handles incoming requests from users by:
                <ol>
                  <li>
                    Extracting metadata from requests and signing them (adds a
                    signature header to the request for billing purposes).
                  </li>
                  <li>
                    Verifying the signature in each response (the second step in
                    service verification).
                  </li>
                </ol>
              </li>
            </ol>
            <p>
              <strong>Provider Broker Responsibilities:</strong>
            </p>
            <ol>
              <li>
                Offers{" "}
                <a href="/api.html" target="_blank" rel="noopener noreferrer">
                  endpoints{" "}
                </a>
                for the provider to register pre-prepared services (LLM Service)
                onto the contract and offers endpoints for checking, updating,
                and deleting services.
              </li>
              <li>
                Proxies incoming requests by:
                <ol>
                  <li>Verifying and recording requests.</li>
                  <li>Distributing requests to the corresponding services.</li>
                </ol>
              </li>
              <li>Performs settlements using recorded requests as vouchers.</li>
            </ol>

            <p>
              <strong>
                LLM Service (prepared by the provider) Requirements:
              </strong>
            </p>
            <ol>
              <li>Comply with OpenAI&apos;API specifications</li>
              <li>
                Integrates a signer within a TEE environment to sign every
                response.
              </li>
              <li>
                Provides an interface to download the signer key&apos;RA (after
                registering the LLM Service, the Provider Broker will proxy this
                interface).
              </li>
            </ol>
          </div>
        </div>
      </div>
    </>
  );
};

export default BackGround;
