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
import { seringContractAddress } from "./config";

const ServiceItem: React.FC<{
  service: ServiceStructOutput;
  onSelect: (provider: `0x${string}`, serviceName: string) => void;
}> = ({ service, onSelect }) => {
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
        <button
          onClick={() =>
            onSelect(service.provider as `0x${string}`, service.name)
          }
        >
          select
        </button>
      </td>
    </tr>
  );
};

const Service: React.FC<{
  onSelectService: (provider: `0x${string}`, name: string) => void;
}> = ({ onSelectService }) => {
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

  const selectService = (providerAddress: `0x${string}`, service: string) => {
    onSelectService(providerAddress, service);
  };

  return (
    <>
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
            <tbody style={{ textAlign: "center" }}>
              {providerServices.map((service) => {
                return (
                  <ServiceItem
                    key={service.provider + service.name}
                    service={service}
                    onSelect={selectService}
                  />
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};

export default Service;
