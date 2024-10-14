"use client";

import {
  Connector,
  CreateConnectorFn,
  useAccount,
  useConnect,
  useDisconnect,
  useReadContract,
} from "wagmi";
import { readContract } from "@wagmi/core";

import {
  ZGServingUserBroker,
  Config,
  createZGServingUserBroker,
  ServiceStructOutput,
  AccountStructOutput,
} from "@0glabs/0g-serving-broker";
import { useEthersSigner } from "@/utils/ethers";
import React, { useEffect, useReducer, useState } from "react";
import ChatBot from "react-chatbotify";
import OpenAI from "openai";
import dayjs from "dayjs";
import { abi } from "./abi";
import { useWriteContract } from "wagmi";
import { AddressLike } from "ethers";
import { getConfig } from "@/wagmi";

// const providerAddress = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8";

const processorConfig: Config = {
  requestLength: 40,
};

const seringContractAddress = "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9";

function App() {
  // const [request, setRequest] = useState("");
  const [response, setResponse] = useState("");
  const [storageData, setStorageData] = useState("");
  const [processor, setProcessor] =
    useState<Promise<ZGServingUserBroker> | null>(null);
  const [config] = useState(() => getConfig());

  const account = useAccount();
  const { connectors, connect, status, error } = useConnect();
  const { disconnect } = useDisconnect();

  const signer = useEthersSigner();

  useEffect(() => {
    if (account.status !== "connected" || !signer) {
      setProcessor(null);
    } else {
      const newProcessor = createZGServingUserBroker(
        processorConfig,
        signer,
        seringContractAddress
      );
      setProcessor(newProcessor);
    }
  }, [account.status, signer]);

  // List services
  const [providerAddress, setProviderAddress] = useState<`0x${string}`>();
  const [serviceName, setServiceName] = useState<string>();

  const [providerServices, setProviderServices] = useState<any[]>([]);
  const services = useReadContract({
    abi,
    address: seringContractAddress,
    functionName: "getAllServices",
  })?.data;

  useEffect(() => {
    if (services) {
      setProviderServices((services as ServiceStructOutput[]) || []);
    }
  }, [services]);

  // Verify Service Signer
  const [signerAddress, setSignerAddress] = useState<string>();

  const handleDownloadReport = () => {
    const reportContent = document.getElementById(
      "reportContent"
    ) as HTMLElement;

    fetch("http://localhost:8081/v1/proxy/test-chat/attestation/report", {
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
        setSignerAddress(data.signing_address);
        reportContent.textContent = JSON.stringify(data, null, 2);
      })
      .catch((error) => {
        reportContent.textContent = "Error: " + error.message;
      });
  };

  // Create an Account
  const { data: hash, writeContract } = useWriteContract();
  const [userAccount, setAccount] = useState<AccountStructOutput>();

  const [accountFormData, setAccountFormData] = useState({
    providerAddress: "",
    balance: "",
  });

  const handleAccountFormDataChange = (e: any) => {
    const { name, value } = e.target;
    setAccountFormData({
      ...accountFormData,
      [name]: value,
    });
  };

  interface KeyPair {
    privkey: string[];
    pubkey: string[];
  }
  const host = "http://localhost:3000";
  const generateKeyPair = async (): Promise<KeyPair> => {
    const response = await fetch(host + "/sign-keypair");
    const data = await response.json();
    return data;
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    const providerAddress = accountFormData.providerAddress as `0x${string}`;

    const { privkey, pubkey } = await generateKeyPair();
    console.log(pubkey);
    console.log(accountFormData.balance);
    writeContract({
      address: seringContractAddress,
      abi,
      functionName: "addAccount",
      args: [providerAddress, [BigInt(pubkey[0]), BigInt(pubkey[1])]],
      value: BigInt(accountFormData.balance),
    });
  };

  const fetchAccountData = async (providerAddress: any) => {
    try {
      const result = await readContract(config, {
        abi,
        address: seringContractAddress,
        functionName: "getAccount",
        args: [account.addresses![0], providerAddress],
      });
      if (result) {
        setAccount(result as AccountStructOutput);
      }
    } catch (error) {
      console.error("Error fetching account data", error);
    }
  };

  // 4. ChatBot: refer to https://react-chatbotify.com/docs/examples/llm_conversation
  let modelType = "meta-llama/meta-llama-3.1-8b-instruct";
  let hasError = false;

  const [chatHistory, setChatHistory] = useState<any[]>([]);

  const selectService = (providerAddress: any, service: string) => {
    setProviderAddress(providerAddress);
    setServiceName(service);
  };

  let chatID = "";
  const call_openai = async (params: any) => {
    try {
      const openai = new OpenAI({
        baseURL: "http://localhost:8081/v1/proxy/test-chat",
        apiKey: "",
        dangerouslyAllowBrowser: true, // required for testing on browser side, not recommended
      });

      const headers = await (
        await processor
      )?.requestProcessor.processRequest(
        providerAddress || "",
        serviceName || "",
        params.userInput
      );

      // for streaming responses in parts (real-time), refer to real-time stream example
      const chatCompletion = await openai.chat.completions.create(
        {
          messages: [{ role: "user", content: params.userInput }],
          model: modelType,
        },
        {
          headers: {
            "X-Phala-Signature-Type": "StandaloneApi",
            ...headers,
          },
        }
      );

      await params.injectMessage(chatCompletion.choices[0].message.content);

      await (
        await processor
      )?.responseProcessor.processResponse(
        providerAddress || "",
        serviceName || "",
        chatCompletion.choices[0].message.content || "",
        ""
      );

      const history = chatHistory;
      history.push({
        id: chatCompletion.id,
        fee: headers?.["Fee"],
      });
      setChatHistory(history);
      await params.endStreamMessage();
    } catch (error) {
      console.log(String(error));
      await params.injectMessage(String(error));
      hasError = true;
    }
  };

  // const call_openai = async (params: any) => {
  //   try {
  //     const openai = new OpenAI({
  //       baseURL: "http://localhost:8081/v1/proxy/test-chat",
  //       apiKey: "",
  //       dangerouslyAllowBrowser: true,
  //     });

  //     const headers = await (
  //       await processor
  //     )?.requestProcessor.processRequest(
  //       providerAddress || "",
  //       serviceName || "",
  //       params.userInput
  //     );

  //     const { data: chatCompletion, response: raw } =
  //       await openai.chat.completions
  //         .create(
  //           {
  //             messages: [{ role: "user", content: params.userInput }],
  //             model: modelType,
  //             stream: true,
  //           },
  //           {
  //             headers: {
  //               "X-Phala-Signature-Type": "StandaloneApi",
  //               ...headers,
  //             },
  //           }
  //         )
  //         .withResponse();

  //     let text = "";
  //     let offset = 0;
  //     for await (const chunk of chatCompletion) {
  //       if (!chatID) {
  //         chatID = chunk.id;
  //       }
  //       const chunkText = chunk.choices[0].delta.content || "";
  //       text += chunkText;
  //       for (let i = offset; i < text.length; i++) {
  //         await params.streamMessage(text.slice(0, i + 1));
  //         await new Promise((resolve) => setTimeout(resolve, 30));
  //       }
  //       offset += chunkText.length;
  //     }

  //     await (
  //       await processor
  //     )?.responseProcessor.processResponse(
  //       providerAddress || "",
  //       serviceName || "",
  //       text,
  //       ""
  //     );

  //     const history = chatHistory;
  //     history.push({
  //       id: chatID,
  //       fee: headers?.["Fee"],
  //     });
  //     setChatHistory(history);
  //     await params.endStreamMessage();
  //   } catch (error) {
  //     console.log(String(error));
  //     await params.injectMessage(String(error));
  //     hasError = true;
  //   }
  // };

  const [ignored, forceUpdate] = useReducer((x) => x + 1, 0);

  const flow = {
    start: {
      message: "Ask me anything!",
      path: "loop",
    },
    loop: {
      message: async (params: any) => {
        await call_openai(params);
      },
      path: () => {
        if (hasError) {
          return "start";
        }
        return "loop";
      },
    },
  };

  const ServiceItem: React.FC<{
    service: ServiceStructOutput;
  }> = ({ service }) => {
    return (
      <tr>
        <td style={{ border: "1px solid black", padding: "8px" }}>
          {service.provider}
        </td>
        <td style={{ border: "1px solid black", padding: "8px" }}>
          {service.name}
        </td>
        <td style={{ border: "1px solid black", padding: "8px" }}>
          {service.url}
        </td>
        <td style={{ border: "1px solid black", padding: "8px" }}>
          {service.inputPrice.toString()}
        </td>
        <td style={{ border: "1px solid black", padding: "8px" }}>
          {service.outputPrice.toString()}
        </td>
        <td style={{ border: "1px solid black", padding: "8px" }}>
          <button onClick={() => selectService(service.provider, service.name)}>
            select
          </button>
        </td>
      </tr>
    );
  };

  // Verify
  const [selectedChatHistoryItemID, setSelectedChatHistoryItemID] =
    useState<string>();

  const ChatHistoryItem: React.FC<{
    id: string;
    fee: string;
  }> = ({ id, fee }) => {
    return (
      <tr>
        <td style={{ border: "1px solid black", padding: "8px" }}>{id}</td>
        <td style={{ border: "1px solid black", padding: "8px" }}>{fee}</td>
        <td style={{ border: "1px solid black", padding: "8px" }}>
          <button onClick={() => setSelectedChatHistoryItemID(id)}>
            verify
          </button>
        </td>
      </tr>
    );
  };

  const handleGetSig = (chatID: string) => {
    const signatureContent = document.getElementById(
      "signatureContent"
    ) as HTMLElement;

    fetch(`http://localhost:8081/v1/proxy/test-chat/signature/${chatID}`, {
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
        signatureContent.textContent = JSON.stringify(data, null, 2);
      })
      .catch((error) => {
        signatureContent.textContent = "Error: " + error.message;
      });
  };

  return (
    <div
      style={{
        display: "flex",
        backgroundColor: "#ffffff",
        flexDirection: "column",
      }}
    >
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
          1. 0G Serving is a DApp that connects providers with AI models or
          hardware to users of AI services through an AI service marketplace.
          <br />
          2. Users can freely choose services registered on the platform by
          providers, and providers can freely set prices for their services. The
          0G Serving system offers service verification and billing functions.
          <br />
          <br />
          Current Stage: Providers offer AI inference services.
        </p>
      </div>

      <div
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
              certain amount of funds into the provider's smart contract.
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
              The provider's inference service runs within a Trusted Execution
              Environment (TEE).
            </li>
            <li>
              Within the TEE environment, a signer component generates a key
              pair, and the public key is included in a Remote Attestation (RA)
              when the provider registers the service, which is available for
              the user to obtain.
            </li>
            <li>
              The provider's service responses are signed with the private key.
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
      </div>

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
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <img
            style={{
              padding: "20px",
              display: "flex",
            }}
            src="/serving-overview.png"
            width="60%"
          />
          <div style={{ alignSelf: "flex-start" }}>
            <>
              <p>
                <strong>The basic components of 0G Serving include:</strong>
              </p>
              <ol>
                <li>Provider Broker.</li>
                <li>0G Marketplace (User Broker).</li>
                <li>Contract.</li>
                <li>LLM Service (prepared by the provider).</li>
              </ol>
              <p>
                <strong>Deployment Locations:</strong>
              </p>
              <ol>
                <li>The Contract is deployed on the 0G blockchain.</li>
                <li>
                  The 0G Marketplace is a purely front-end platform, hosted by
                  the 0G team, and runs in the customer's browser.
                </li>
                <li>
                  The Provider Broker and LLM Service run on the provider's own
                  servers.
                  <ol>
                    <li>
                      The Provider Broker runs in a container, with an image
                      provided by the 0G team.
                    </li>
                    <li>
                      The LLM Service is managed by the provider and can be run
                      in any form as long as it adheres to the 0G Serving
                      protocol.
                    </li>
                  </ol>
                </li>
              </ol>
              <p>
                <strong>Provider Broker Responsibilities:</strong>
              </p>
              <ol>
                <li>
                  <a href="/api.html" target="_blank" rel="noopener noreferrer">
                    Provide endpoints{" "}
                  </a>
                  for the provider to register pre-prepared services (LLM
                  Service) onto the contract and offers endpoints for checking,
                  updating, and deleting services.
                </li>
                <li>
                  Proxies incoming requests by:
                  <ol>
                    <li>Verifying and recording requests.</li>
                    <li>
                      Distributing requests to the corresponding services.
                    </li>
                  </ol>
                </li>
                <li>
                  Performs settlements using recorded requests as vouchers.
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
                  Verifies the service's signer RA (the first step in service
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
                      Verifying the signature in each interaction (the second
                      step in service verification).
                    </li>
                  </ol>
                </li>
              </ol>
              <p>
                <strong>Contract Responsibilities:</strong>
              </p>
              <ol>
                <li>
                  Stores critical variables during the serving process, such as
                  account information (user address, provider address, balance,
                  etc.) and service information (names, URLs, etc.).
                </li>
                <li>
                  Includes the consensus logic of the serving system, such as:
                  <ol>
                    <li>How to verify request settlements.</li>
                    <li>
                      How to determine the legitimacy of settlement proof
                      (requests).
                    </li>
                    <li>How users obtain refunds, etc.</li>
                  </ol>
                </li>
              </ol>
              <p>
                <strong>
                  LLM Service (prepared by the provider) Requirements:
                </strong>
              </p>
              <ol>
                <li>
                  Integrates a signer within a TEE environment to sign every
                  response.
                </li>
                <li>
                  Provides an interface to download the signer key's RA (after
                  registering the LLM Service, the Provider Broker will proxy
                  this interface).
                </li>
              </ol>
            </>
          </div>
        </div>
      </div>

      <div style={{ display: "flex" }}>
        {/* left panel */}
        <div
          style={{
            display: "flex",
            padding: "20px",
            flex: "0 0 60%",
            backgroundColor: "#f0f0f0",
            overflowY: "auto",
            maxHeight: "100vh",
            flexDirection: "column",
          }}
        >
          <h1>0G Marketplace Demo</h1>
          {/* 1. Connect Wallet */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "left",
            }}
          >
            <h2 style={{ alignSelf: "flex-start" }}>1. Connect Wallet</h2>
            <div style={{ flexDirection: "row" }}>
              {connectors.map((connector) => (
                <button
                  style={{ marginRight: "10px" }}
                  key={connector.uid}
                  onClick={() => connect({ connector })}
                  type="button"
                >
                  {connector.name}
                </button>
              ))}
            </div>

            <div style={{ marginTop: "10px" }}>
              {account.status === "connected" && (
                <button type="button" onClick={() => disconnect()}>
                  Disconnect
                </button>
              )}
            </div>
          </div>

          {/* 2. List Services */}
          <div style={{ borderBottom: "1px solid #ccc", margin: "20px 0" }} />
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "left",
            }}
          >
            <h2 style={{ alignSelf: "flex-start" }}>2. List Services</h2>

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
                      provider
                    </th>
                    <th style={{ border: "1px solid black", padding: "8px" }}>
                      name
                    </th>
                    <th style={{ border: "1px solid black", padding: "8px" }}>
                      url
                    </th>
                    <th style={{ border: "1px solid black", padding: "8px" }}>
                      inputPrice
                    </th>
                    <th style={{ border: "1px solid black", padding: "8px" }}>
                      outputPrice
                    </th>
                    <th style={{ border: "1px solid black", padding: "8px" }}>
                      select
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {providerServices.map((service) => {
                    return (
                      <ServiceItem
                        key={service.provider + service.name}
                        service={service}
                      />
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

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
              <h3 id="request">
                (a) Download Attestation Report (get signer address)
              </h3>
              <pre style={{ marginLeft: "35px" }}>
                <code>
                  curl -X GET
                  http://localhost:8081/v1/proxy/test-chat/attestation/report
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
                    <textarea id="reportContent" rows={4} cols={50} readOnly />
                  </div>
                </div>
              </pre>
              <h3 id="verify-the-attestation">(b) Verify the Attestation</h3>
              <pre style={{ marginLeft: "35px" }}>
                <a
                  href="https://docs.attestation.nvidia.com/api-docs/nras.html#tag--GPU-Attestation-API"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  https://docs.attestation.nvidia.com/api-docs/nras.html#tag--GPU-Attestation-API
                </a>
              </pre>
            </>
          </div>

          {/* 4. Create an Account */}
          <div style={{ borderBottom: "1px solid #ccc", margin: "20px 0" }} />
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "left",
            }}
          >
            <h2 style={{ alignSelf: "flex-start" }}>4. Create an Account</h2>
            <form onSubmit={handleSubmit}>
              <div>
                <label
                  htmlFor="name"
                  style={{ display: "inline-block", width: "200px" }}
                >
                  Provider Address:
                </label>
                <input
                  type="text"
                  id="providerAddress"
                  name="providerAddress"
                  value={accountFormData.providerAddress}
                  onChange={handleAccountFormDataChange}
                  required
                />
              </div>
              <div>
                <label
                  htmlFor="balance"
                  style={{ display: "inline-block", width: "200px" }}
                >
                  Balance:
                </label>
                <input
                  type="number"
                  id="balance"
                  name="balance"
                  value={accountFormData.balance}
                  onChange={handleAccountFormDataChange}
                  required
                />
              </div>
              <button
                style={{
                  width: "150px",
                  marginTop: "20px",
                  marginRight: "10px",
                }}
                type="submit"
              >
                Submit
              </button>
            </form>
            <button
              style={{ width: "150px", marginTop: "20px" }}
              onClick={() => fetchAccountData(providerAddress)}
            >
              Get Account
            </button>
          </div>
          {/* 5. Chat */}
          <div style={{ borderBottom: "1px solid #ccc", margin: "20px 0" }} />

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <h2 style={{ alignSelf: "flex-start" }}>5. PlayGround</h2>
            <h4 style={{ alignSelf: "flex-start" }}>(a) Select a Services</h4>
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
                      provider
                    </th>
                    <th style={{ border: "1px solid black", padding: "8px" }}>
                      name
                    </th>
                    <th style={{ border: "1px solid black", padding: "8px" }}>
                      url
                    </th>
                    <th style={{ border: "1px solid black", padding: "8px" }}>
                      inputPrice
                    </th>
                    <th style={{ border: "1px solid black", padding: "8px" }}>
                      outputPrice
                    </th>
                    <th style={{ border: "1px solid black", padding: "8px" }}>
                      select
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {providerServices.map((service) => {
                    return (
                      <ServiceItem
                        key={service.provider + service.name}
                        service={service}
                      />
                    );
                  })}
                </tbody>
              </table>
            </div>

            <h4 style={{ alignSelf: "flex-start" }}>(b) Chat</h4>
            {/* <ChatBot
              settings={{
                general: { embedded: true },
                chatHistory: { storageKey: "example_real_time_stream" },
                botBubble: { simStream: true },
              }}
              flow={flow}
            /> */}
            <ChatBot
              settings={{
                general: { embedded: true },
                chatHistory: { storageKey: "example_llm_conversation" },
              }}
              flow={flow}
            />
          </div>
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
              (During the conversation, the system will automatically monitor
              the validity of the dialogue in the background, but manual
              confirmation via a UI page is also supported)
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
                      select
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {chatHistory.map((item) => {
                    return (
                      <ChatHistoryItem
                        key={item.id + item.fee}
                        id={item.id}
                        fee={item.fee}
                      />
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* conversion */}
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
                      curl http://localhost:8081/v1/proxy/test-chat/signature/
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
        </div>

        {/* right panel*/}
        <div
          style={{
            padding: "20px",
            flex: "0 0 40%",
            backgroundColor: "#f7f7f7",
            fontSize: "small",
          }}
        >
          {/* wallet */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "left",
            }}
          >
            <h2 style={{ alignSelf: "flex-start" }}>Wallet</h2>
            <div>
              <h3>status: {account.status}</h3>
              address: {account.addresses?.[0].toString()}
              <br />
              chainId: {account.chainId}
            </div>
          </div>

          {/* signerAddress */}
          {signerAddress ? (
            <>
              <div
                style={{ borderBottom: "1px solid #ccc", margin: "20px 0" }}
              />
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "left",
                }}
              >
                <h2 style={{ alignSelf: "flex-start" }}>Signer Address</h2>
                <div>Signer Address: {signerAddress};</div>
              </div>
            </>
          ) : (
            ""
          )}

          {/* service */}
          {providerAddress ? (
            <>
              <div
                style={{ borderBottom: "1px solid #ccc", margin: "20px 0" }}
              />
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "left",
                }}
              >
                <h2 style={{ alignSelf: "flex-start" }}>Selected Service</h2>
                <div>
                  Provider Address: {providerAddress};
                  <br />
                  Service Name: {serviceName};
                </div>
              </div>
            </>
          ) : (
            ""
          )}

          {/* account */}
          {userAccount ? (
            <>
              <div
                style={{ borderBottom: "1px solid #ccc", margin: "20px 0" }}
              />
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "left",
                }}
              >
                <h2 style={{ alignSelf: "flex-start" }}>Account</h2>

                <div>
                  ProviderAddress: {userAccount?.provider}
                  <br />
                  Balance: {userAccount?.balance.toString()} (neuron)
                </div>
              </div>
            </>
          ) : (
            ""
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
