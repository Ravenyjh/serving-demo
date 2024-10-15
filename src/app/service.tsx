import { useReadContract } from "wagmi";
import { ServiceStructOutput } from "@0glabs/0g-serving-broker";
import React, { useEffect, useState } from "react";

import { abi } from "./abi";
import { seringContractAddress } from "./config";

const ServiceItem: React.FC<{
  service: ServiceStructOutput;
  onSelect: (provider: `0x${string}`, serviceName: string, url: string) => void;
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
            onSelect(
              service.provider as `0x${string}`,
              service.name,
              service.url
            )
          }
        >
          select
        </button>
      </td>
    </tr>
  );
};

const Service: React.FC<{
  onSelectService: (provider: `0x${string}`, name: string, url: string) => void;
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

  const selectService = (
    providerAddress: `0x${string}`,
    service: string,
    url: string
  ) => {
    onSelectService(providerAddress, service, url);
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
