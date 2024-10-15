const Provider: React.FC = () => {
  return (
    <>
      {" "}
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
            flex: "0 0 60%",
            backgroundColor: "#ffffff",
            overflowY: "auto",
            maxHeight: "100vh",
            flexDirection: "column",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "left",
            }}
          >
            <h1>Steps to Prepare a Service (Provider's Process) </h1>

            <h2 style={{ alignSelf: "flex-start" }}>1. Prepare a Service</h2>

            <h2 style={{ alignSelf: "flex-start" }}>
              2. Start Provider Broker Containers with Public IP
            </h2>

            <h2 style={{ alignSelf: "flex-start" }}>
              3. Register the Service Using an{" "}
              <a
                href="/api.html#api-Service-registerService"
                target="_blank"
                rel="noopener noreferrer"
              >
                Endpoint
              </a>{" "}
              of Provider Broker
            </h2>
          </div>
        </div>
      </div>
    </>
  );
};

export default Provider;
