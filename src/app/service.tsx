import {
  ZGServingUserBroker,
  ZGServingModel,
  ZGService,
} from "@0glabs/0g-serving-broker";
import React, { useState } from "react";

const ModelItem: React.FC<{
  model: ZGServingModel;
  onSelect: (name: string) => void;
}> = ({ model, onSelect }) => {
  return (
    <tr>
      <td style={{ border: "1px solid black", padding: "8px" }}>
        {model.Name}
      </td>
      <td style={{ border: "1px solid black", padding: "8px" }}>
        {model.Author}
      </td>
      <td style={{ border: "1px solid black", padding: "8px" }}>
        {model.Type}
      </td>
      <td style={{ border: "1px solid black", padding: "8px" }}>
        {model.Price}
      </td>
      <td style={{ border: "1px solid black", padding: "8px" }}>
        {model.ZGAlignmentScore}
      </td>
      <td style={{ border: "1px solid black", padding: "8px" }}>
        {model.Verifiability}
      </td>
      <td style={{ border: "1px solid black", padding: "8px" }}>
        <button onClick={() => onSelect(model.Name)}>select</button>
      </td>
    </tr>
  );
};

const ServiceItem: React.FC<{
  service: ZGService;
  onSelect: (provider: `0x${string}`, serviceName: string, url: string) => void;
}> = ({ service, onSelect }) => {
  return (
    <tr>
      <td style={{ border: "1px solid black", padding: "8px" }}>
        {service.ProviderAddress}
      </td>
      <td style={{ border: "1px solid black", padding: "8px" }}>
        {service.Device}
      </td>
      <td style={{ border: "1px solid black", padding: "8px" }}>
        {service.Geolocation}
      </td>
      <td style={{ border: "1px solid black", padding: "8px" }}>
        {service.Uptime}
      </td>
      <td style={{ border: "1px solid black", padding: "8px" }}>
        {service.Verifiability}
      </td>
      <td style={{ border: "1px solid black", padding: "8px" }}>
        {service.InputPrice}
      </td>
      <td style={{ border: "1px solid black", padding: "8px" }}>
        <button
          onClick={() =>
            onSelect(
              service.ProviderAddress as `0x${string}`,
              service.Name,
              service.URL
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
  processor: Promise<ZGServingUserBroker> | null;
  onSelectService: (
    provider: `0x${string}`,
    name: string,
    modelType: string,
    url: string
  ) => void;
}> = ({ processor, onSelectService }) => {
  const [providers, setProviders] = useState<any[]>([]);
  const [models, setModels] = useState<any[]>();
  const [model, setModel] = useState<any>();

  const handleListModel = async () => {
    try {
      const models = await (await processor)?.modelProcessor.listModels();
      setModels((models as ZGServingModel[]) || []);
    } catch (error) {
      console.error(error);
    }
  };

  const selectModel = async (name: string) => {
    setModel(name);
    try {
      const selectedModel = await (
        await processor
      )?.modelProcessor.getModel(name);
      setProviders((selectedModel as ZGServingModel).Providers);
    } catch (error) {
      console.error(error);
    }
  };

  const selectService = (
    providerAddress: `0x${string}`,
    service: string,
    url: string
  ) => {
    onSelectService(providerAddress, service, model, url);
  };

  return (
    <>
      <div style={{ borderBottom: "1px solid #ccc", margin: "20px 0" }} />
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "left",
        }}
      >
        <h2 style={{ alignSelf: "flex-start" }}>2. List Models && Providers</h2>

        <h4>Models</h4>
        {/* 2.1 List Models */}

        <button
          style={{
            width: "150px",
            marginBottom: "20px",
            marginRight: "10px",
          }}
          type="submit"
          onClick={() => handleListModel()}
        >
          List Models
        </button>

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
                  Name
                </th>
                <th style={{ border: "1px solid black", padding: "8px" }}>
                  Author
                </th>
                <th style={{ border: "1px solid black", padding: "8px" }}>
                  Type
                </th>
                <th style={{ border: "1px solid black", padding: "8px" }}>
                  Price
                </th>
                <th style={{ border: "1px solid black", padding: "8px" }}>
                  ZGAlignmentScore
                </th>
                <th style={{ border: "1px solid black", padding: "8px" }}>
                  Verifiability
                </th>
                <th style={{ border: "1px solid black", padding: "8px" }}>
                  select
                </th>
              </tr>
            </thead>
            <tbody style={{ textAlign: "center" }}>
              {(models || []).map((model: any) => {
                return (
                  <ModelItem
                    key={model.name}
                    model={model}
                    onSelect={selectModel}
                  />
                );
              })}
            </tbody>
          </table>
        </div>

        {model ? (
          <>
            <h4>Providers</h4>

            <button
              style={{
                width: "150px",
                marginBottom: "20px",
                marginRight: "10px",
              }}
              type="submit"
              onClick={() => handleListModel()}
            >
              List Providers
            </button>

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
                      ProviderAddress
                    </th>
                    <th style={{ border: "1px solid black", padding: "8px" }}>
                      Device
                    </th>
                    <th style={{ border: "1px solid black", padding: "8px" }}>
                      Geolocation
                    </th>
                    <th style={{ border: "1px solid black", padding: "8px" }}>
                      Uptime
                    </th>
                    <th style={{ border: "1px solid black", padding: "8px" }}>
                      Verifiability
                    </th>
                    <th style={{ border: "1px solid black", padding: "8px" }}>
                      Price
                    </th>
                    <th style={{ border: "1px solid black", padding: "8px" }}>
                      select
                    </th>
                  </tr>
                </thead>
                <tbody style={{ textAlign: "center" }}>
                  {providers.map((provider) => {
                    return (
                      <ServiceItem
                        key={provider.ProviderAddress + provider.Name}
                        service={provider}
                        onSelect={selectService}
                      />
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          ""
        )}
      </div>
    </>
  );
};

export default Service;
