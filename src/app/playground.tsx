import { ZGServingUserBroker } from "@0glabs/0g-serving-broker";
import React, { useEffect, useState } from "react";
import ChatBot from "react-chatbotify";
import OpenAI from "openai";

const modelMap: { [key: string]: string } = {
  "llama-3.1-8B-Instruct": "meta-llama/meta-llama-3.1-8b-instruct",
  "phi-3-mini-4k-instruct": "microsoft/phi-3-mini-4k-instruct",
};

const PlayGround: React.FC<{
  processor: Promise<ZGServingUserBroker> | null;
  providerAddress: `0x${string}` | "";
  serviceName: string;
  url: string;
  modelType: string;
  onChatHistory: (history: any[]) => void;
}> = ({
  processor,
  providerAddress,
  serviceName,
  url,
  modelType,
  onChatHistory,
}) => {
  // 4. ChatBot: refer to https://react-chatbotify.com/docs/examples/llm_conversation
  // let modelType = "meta-llama/meta-llama-3.1-8b-instruct";
  let hasError = false;

  const [chatHistory, setChatHistory] = useState<any[]>([]);

  // let chatID = "";
  const call_openai = async (params: any) => {
    try {
      const openai = new OpenAI({
        baseURL: `${url}/v1/proxy/${serviceName}`,
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

      const req = {
        messages: [{ role: "user", content: params.userInput }],
        model: modelMap[modelType],
      };
      const chatCompletion = await openai.chat.completions.create(
        {
          messages: [{ role: "user", content: params.userInput }],
          model: modelMap[modelType],
        },
        {
          headers: {
            "X-Phala-Signature-Type": "StandaloneApi",
            ...headers,
          },
        }
      );

      await params.injectMessage(chatCompletion.choices[0].message.content);

      const valid = await (
        await processor
      )?.responseProcessor.processResponse(
        providerAddress || "",
        serviceName || "",
        chatCompletion.choices[0].message.content || "",
        chatCompletion.id
      );

      const history = chatHistory;
      history.push({
        valid,
        id: chatCompletion.id,
        fee: headers?.["Fee"],
        req: JSON.stringify(req, null, 2),
        res: chatCompletion.choices[0].message.content,
      });

      setChatHistory(history);
      onChatHistory(history);
      await params.endStreamMessage();
    } catch (error) {
      await params.injectMessage(String(error));
      hasError = true;
    }
  };
  //   TODO: use Stream after Phala team fix verifying bug
  // const call_openai = async (params: any) => {
  //   try {
  //     const openai = new OpenAI({
  //       baseURL: "http://192.168.2.142:8080/v1/proxy/test-chat",
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

  const createChatBotDom = () => {
    const flow = {
      start: {
        message: `This is service, Ask me anything!`,
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

    return (
      <ChatBot
        settings={{
          general: { embedded: true },
          chatHistory: { storageKey: "example_llm_conversation" },
        }}
        flow={flow}
      />
    );
  };

  let ChatBotDom = createChatBotDom();

  useEffect(() => {
    ChatBotDom = createChatBotDom();
  }, [serviceName]);

  return (
    <>
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
        {/* 
        TODO: use Stream after Phala team fix verifying bug
        <ChatBot
            settings={{
              general: { embedded: true },
              chatHistory: { storageKey: "example_real_time_stream" },
              botBubble: { simStream: true },
            }}
            flow={flow}
         /> */}
        {ChatBotDom}
      </div>
    </>
  );
};

export default PlayGround;
