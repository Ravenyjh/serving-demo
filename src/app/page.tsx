"use client";

import { useAccount, useConnect, useDisconnect } from "wagmi";
import {
  createZGServingUserBroker,
  AccountStructOutput,
  ZGServingUserBroker,
  ZGServingUserBrokerConfig,
} from "@0glabs/0g-serving-broker";
import React, { useEffect, useState } from "react";

import { useEthersSigner } from "@/utils/ethers";

import Service from "./service";
import { seringContractAddress } from "./config";
import SignerVerification from "./signer-verification";
import BackGround from "./background";
import Account from "./account";
import PlayGround from "./playground";
import ConversationVerification from "./conversation-verification";
import State from "./state";
import Provider from "./provider";

function App() {
  const [providerAddress, setProviderAddress] = useState<`0x${string}`>();
  const [serviceName, setServiceName] = useState<string>();
  const [modelType, setModelType] = useState<string>();
  const [url, setUrl] = useState<string>();
  const [signerAddress, setSignerAddress] = useState<string>();
  const [userAccount, setAccount] = useState<AccountStructOutput>();
  const [chatHistory, setChatHistory] = useState<any[]>([]);

  const [processor, setProcessor] =
    useState<Promise<ZGServingUserBroker> | null>(null);

  const account = useAccount();
  const { connectors, connect, status, error } = useConnect();
  const { disconnect } = useDisconnect();

  const signer = useEthersSigner();

  useEffect(() => {
    const zGServingBrokerConfig: ZGServingUserBrokerConfig = {
      dcapWasmPath: "/dcap-qvl-web_bg.wasm",
    };

    if (account.status !== "connected" || !signer) {
      setProcessor(null);
    } else {
      const newProcessor = createZGServingUserBroker(
        signer,
        seringContractAddress,
        zGServingBrokerConfig
      );
      setProcessor(newProcessor);
    }
  }, [account.status, signer]);

  return (
    <div
      style={{
        display: "flex",
        backgroundColor: "#ffffff",
        flexDirection: "column",
      }}
    >
      <BackGround />
      <div style={{ borderBottom: "1px solid #ccc", margin: "20px 0" }} />

      <Provider />
      <div style={{ borderBottom: "1px solid #ccc", margin: "20px 0" }} />

      <div style={{ display: "flex" }}>
        {/* left panel */}
        <div
          style={{
            display: "flex",
            padding: "20px",
            flex: "0 0 60%",
            backgroundColor: "#ffffff",
            overflowY: "auto",
            maxHeight: "100vh",
            flexDirection: "column",
          }}
        >
          <h1>Steps to Utilize a Service (User&apos;Process) </h1>
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

          <Service
            processor={processor}
            onSelectService={(
              provider: `0x${string}`,
              name,
              modelType,
              url
            ) => {
              setProviderAddress(provider);
              setServiceName(name);
              setModelType(modelType);
              setUrl(url);
            }}
          />

          <SignerVerification
            onSetSignerAddress={(signerAddress: string) => {
              setSignerAddress(signerAddress);
            }}
            processor={processor}
            providerAddress={providerAddress || ""}
            serviceName={serviceName || ""}
            url={url || ""}
          />
          <Account
            processor={processor}
            userAddress={account.addresses?.[0] || ""}
            providerAddress={providerAddress || ""}
            onSetUserAccount={(account: AccountStructOutput) => {
              setAccount(account);
            }}
          />

          <PlayGround
            processor={processor}
            providerAddress={providerAddress || ""}
            serviceName={serviceName || ""}
            url={url || ""}
            modelType={modelType || ""}
            onChatHistory={(history: any[]) => {
              setChatHistory(history);
            }}
          />

          <ConversationVerification
            chatHistory={chatHistory}
            serviceName={serviceName || ""}
            url={url || ""}
          />
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
          <State
            account={account}
            signerAddress={signerAddress || ""}
            providerAddress={providerAddress || ""}
            userAccount={userAccount || null}
            serviceName={serviceName || ""}
          />
        </div>
      </div>
    </div>
  );
}

export default App;
