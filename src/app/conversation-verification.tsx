"use client";

import React, { useReducer, useState } from "react";

const ConversationVerification: React.FC<{
  chatHistory: any[];
  serviceName: string;
  url: string;
}> = ({ chatHistory, serviceName, url }) => {
  // Verify
  const [selectedChatHistoryItemID, setSelectedChatHistoryItemID] =
    useState<string>();
  const [signatureContentValue, setSignatureContentValue] = useState<string>();

  const [_, forceUpdate] = useReducer((x) => x + 1, 0);

  const ChatHistoryItem: React.FC<{
    id: string;
    fee: string;
    req: string;
    res: string;
  }> = ({ id, fee, req, res }) => {
    return (
      <tr>
        <td style={{ border: "1px solid black", padding: "8px" }}>{id}</td>
        <td style={{ border: "1px solid black", padding: "8px" }}>{fee}</td>
        <td style={{ border: "1px solid black", padding: "8px" }}>{req}</td>
        <td style={{ border: "1px solid black", padding: "8px" }}>{res}</td>
        <td style={{ border: "1px solid black", padding: "8px" }}>
          <button onClick={() => setSelectedChatHistoryItemID(id)}>
            verify
          </button>
        </td>
      </tr>
    );
  };

  const handleGetSig = (chatID: string) => {
    fetch(`${url}/v1/proxy/${serviceName}/signature/${chatID}`, {
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
        if (data.text) {
          try {
            const lines = data.text.split("\n");
            console.log("lines", lines);
            if (lines.length !== 2) {
              throw new Error("text was not ok");
            }
            const req = JSON.parse(lines[0]);
            const res = JSON.parse(lines[1]);

            data.text = `${req}\n${res}`;
            data.req = JSON.stringify(req);
            data.res = JSON.stringify(res);
            console.log("data", data);
          } catch (e) {
            console.error("Failed to parse text:", String(e));
          }
        }
        setSignatureContentValue(JSON.stringify(data, null, 2));
        // signatureContent.textContent = JSON.stringify(data, null, 2);
      })
      .catch((error) => {
        setSignatureContentValue("Error: " + error.message);
        // signatureContent.textContent = "Error: " + error.message;
      });
  };

  return (
    <>
      {/* 6. Verify */}
      <div style={{ borderBottom: "1px solid #ccc", margin: "20px 0" }} />
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "left",
        }}
      >
        <h2 style={{ alignSelf: "flex-start" }}>6. Verify a Conversion</h2>
        <p>
          (During the conversation, the system will automatically monitor the
          validity of the dialogue in the background, but manual confirmation
          via a UI page is also supported)
        </p>
        <button style={{ width: "150px" }} onClick={forceUpdate}>
          Get History
        </button>
        <br />
        <h4>History</h4>
        <div>
          <table
            style={{
              borderCollapse: "collapse",
              width: "100%",
              fontSize: "x-small",
            }}
          >
            <thead>
              <tr>
                <th style={{ border: "1px solid black", padding: "8px" }}>
                  id
                </th>
                <th style={{ border: "1px solid black", padding: "8px" }}>
                  fee
                </th>
                <th style={{ border: "1px solid black", padding: "8px" }}>
                  req
                </th>
                <th style={{ border: "1px solid black", padding: "8px" }}>
                  res
                </th>
                <th style={{ border: "1px solid black", padding: "8px" }}>
                  select
                </th>
              </tr>
            </thead>
            <tbody style={{ textAlign: "center" }}>
              {chatHistory.map((item) => {
                return (
                  <ChatHistoryItem
                    key={item.id + item.fee}
                    id={item.id}
                    fee={item.fee}
                    req={item.req}
                    res={item.res}
                  />
                );
              })}
            </tbody>
          </table>
        </div>

        {/* conversion */}

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
              The marketplace backend automatically verify it using ether.js
              package
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
            <>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "left",
                }}
              >
                <div>
                  <h4 id="get-text">Get Signature</h4>
                  <pre>
                    <code>
                      curl ${url}/v1/proxy/{serviceName}
                      /signature/
                      {selectedChatHistoryItemID
                        ? selectedChatHistoryItemID
                        : "${" + "chatID" + "}"}
                    </code>
                    <div>
                      <button
                        style={{
                          width: "150px",
                          marginTop: "20px",
                          marginRight: "10px",
                        }}
                        type="submit"
                        onClick={() =>
                          handleGetSig(selectedChatHistoryItemID || "")
                        }
                      >
                        Try
                      </button>

                      <div id="signatureResult">
                        <h3>Result:</h3>
                        <textarea
                          id="signatureContent"
                          rows={4}
                          cols={50}
                          readOnly
                          value={signatureContentValue}
                        />
                      </div>
                    </div>
                  </pre>
                </div>
                <br />

                <a
                  href="https://etherscan.io/verifiedSignatures#"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  etherscan
                </a>
              </div>
            </>
          </div>
        </>
      </div>
    </>
  );
};

export default ConversationVerification;
