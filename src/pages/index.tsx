import Head from "next/head";
import { Inter } from "next/font/google";
import { fetchEventSource } from "@microsoft/fetch-event-source";
import styles from "@/styles/Home.module.css";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import { FormEvent, useCallback, useState } from "react";

const inter = Inter({ subsets: ["latin"] });

export default function Home() {
  const supabase = useSupabaseClient();
  const [stream, setStream] = useState(true);
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [inflight, setInflight] = useState(false);

  const onSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();

      // Prevent multiple requests at once
      if (inflight) return;

      // Reset output
      setInflight(true);
      setOutput("");

      try {
        if (stream) {
          // If streaming, we need to use fetchEventSource directly
          await fetchEventSource(
            `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/chat`,
            {
              method: "POST",
              body: JSON.stringify({ input }),
              headers: { "Content-Type": "application/json" },
              onmessage(ev) {
                setOutput((o) => o + ev.data);
              },
            }
          );
          setInput("");
        } else {
          // If not streaming, we can use the supabase client
          const { data } = await supabase.functions.invoke("chat", {
            body: { input },
          });
          setOutput(data);
          setInput("");
        }
      } catch (error) {
        console.error(error);
      } finally {
        setInflight(false);
      }
    },
    [input, stream, inflight, supabase]
  );

  return (
    <>
      <Head>
        <title>Create Next App</title>
        <meta name="description" content="Generated by create next app" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className={`${styles.main} ${inter.className}`}>
        <form
          onSubmit={onSubmit}
          style={{ display: "flex", flexDirection: "column" }}
        >
          <input
            type="text"
            placeholder="Ask a thing..."
            style={{ padding: 5, width: 200, marginBottom: 10 }}
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <div style={{ display: "flex", alignItems: "center" }}>
            <input
              type="checkbox"
              id="stream"
              style={{ marginRight: 5 }}
              checked={stream}
              onChange={() => setStream((s) => !s)}
            />
            <label htmlFor="stream">Stream</label>
          </div>
        </form>
        <div style={{ width: 200 }}>Response: {output}</div>
      </main>
    </>
  );
}
