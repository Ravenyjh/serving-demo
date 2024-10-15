"use client";

import { readContract } from "@wagmi/core";
import {
  AccountStructOutput,
  createZKSigningKey,
  ZGServingUserBroker,
} from "@0glabs/0g-serving-broker";
import React, { useState } from "react";
import { useWriteContract } from "wagmi";

import { getConfig } from "@/wagmi";

import { abi } from "./abi";
import { seringContractAddress } from "./config";

const Account: React.FC<{
  processor: Promise<ZGServingUserBroker> | null;
  userAddress: `0x${string}` | "";
  providerAddress: `0x${string}` | "";
  onSetUserAccount: (account: AccountStructOutput) => void;
}> = ({ processor, userAddress, providerAddress, onSetUserAccount }) => {
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

  interface ZKKeyPair {
    privateKey: [bigint, bigint];
    publicKey: [bigint, bigint];
  }
  const generateKeyPair = async (): Promise<ZKKeyPair> => {
    let zkKey = createZKSigningKey(providerAddress);
    try {
      return createZKSigningKey(providerAddress);
    } catch (error) {
      if (error instanceof Error) {
        console.error(error.message);
      }
    }
    return zkKey;
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    const providerAddress = accountFormData.providerAddress as `0x${string}`;

    const { privateKey, publicKey } = await generateKeyPair();
    console.log("keep the privateKey in a safe place", privateKey);
    writeContract({
      address: seringContractAddress,
      abi,
      functionName: "addAccount",
      args: [providerAddress, publicKey],
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
