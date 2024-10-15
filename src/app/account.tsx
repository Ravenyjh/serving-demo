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
import Service from "./service";
import { seringContractAddress } from "./config";
import SignerVerification from "./signer-verification";
import BackGround from "./background";

const Account: React.FC<{
  userAddress: `0x${string}` | "";
  providerAddress: `0x${string}` | "";
  onSetUserAccount: (account: AccountStructOutput) => void;
}> = ({ userAddress, providerAddress, onSetUserAccount }) => {
  const [config] = useState(() => getConfig());

  // Create an Account
  const { writeContract } = useWriteContract();

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
    if (!userAddress || !providerAddress) {
      return;
    }
    try {
      const result = await readContract(config, {
        abi,
        address: seringContractAddress,
        functionName: "getAccount",
        args: [userAddress, providerAddress],
      });
      if (result) {
        onSetUserAccount(result as AccountStructOutput);
      }
    } catch (error) {
      console.error("Error fetching account data", error);
    }
  };

  return (
    <>
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
    </>
  );
};

export default Account;
