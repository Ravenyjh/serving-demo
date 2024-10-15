import { AccountStructOutput } from "../../../0g-serving-broker/sdk/user/lib.esm/contract";

const State: React.FC<{
  account: any;
  signerAddress: string;
  providerAddress: `0x${string}` | "";
  userAccount: AccountStructOutput | null;
  serviceName: string;
}> = ({
  account,
  signerAddress,
  providerAddress,
  userAccount,
  serviceName,
}) => {
  return (
    <>
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

      {/* service */}
      {providerAddress ? (
        <>
          <div style={{ borderBottom: "1px solid #ccc", margin: "20px 0" }} />
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
              {signerAddress ? (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "row",
                    alignItems: "left",
                  }}
                >
                  <span style={{ fontWeight: "bold" }}>Signer Address: </span>{" "}
                  {signerAddress}
                </div>
              ) : (
                ""
              )}
            </div>
          </div>
        </>
      ) : (
        ""
      )}

      {/* account */}
      {userAccount ? (
        <>
          <div style={{ borderBottom: "1px solid #ccc", margin: "20px 0" }} />
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
    </>
  );
};

export default State;
