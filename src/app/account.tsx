"use client";

import {
  AccountStructOutput,
  ZGServingUserBroker,
} from "@0glabs/0g-serving-broker";
import React, { useState } from "react";

import { getConfig } from "@/wagmi";

const Account: React.FC<{
  processor: Promise<ZGServingUserBroker> | null;
  userAddress: `0x${string}` | "";
  providerAddress: `0x${string}` | "";
  onSetUserAccount: (account: AccountStructOutput) => void;
}> = ({ processor, userAddress, providerAddress, onSetUserAccount }) => {
  const [config] = useState(() => getConfig());

  const [accountFormData, setAccountFormData] = useState({
    providerAddress: "",
    balance: "",
  });

  const [chargeFormData, setTopUpFormData] = useState({
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

  const handleTopUpFormDataChange = (e: any) => {
    const { name, value } = e.target;
    setTopUpFormData({
      ...chargeFormData,
      [name]: value,
    });
  };

  const handleSubmitTopUp = async (e: any) => {
    e.preventDefault();
    const providerAddress = chargeFormData.providerAddress as `0x${string}`;

    try {
      await (
        await processor
      )?.accountProcessor.depositFund(providerAddress, chargeFormData.balance);
    } catch (error) {
      console.error(error);
    }
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    const providerAddress = accountFormData.providerAddress as `0x${string}`;

    try {
      await (
        await processor
      )?.accountProcessor.addAccount(providerAddress, accountFormData.balance);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchAccountData = async (providerAddress: any) => {
    if (!userAddress || !providerAddress) {
      return;
    }
    try {
      const result = await (
        await processor
      )?.accountProcessor.getAccount(userAddress, providerAddress);
      if (result) {
        onSetUserAccount(result as AccountStructOutput);
      }
    } catch (error) {
      console.error(error);
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

        <h3 style={{ alignSelf: "flex-start" }}> Top up an Account</h3>

        <form onSubmit={handleSubmitTopUp}>
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
              value={chargeFormData.providerAddress}
              onChange={handleTopUpFormDataChange}
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
              value={chargeFormData.balance}
              onChange={handleTopUpFormDataChange}
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
