"use client";
import React, { useState } from "react";
import styles from "./page.module.css";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import axios from "axios";
import Constants from "@/utils/constants";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();
  const handleLogin = () => {
    if (email === "" || password === "") {
      return;
    }
    const data = {
      email,
      password,
    };
    axios.post(`${Constants.API_URL}/${Constants.USER}/login`, data)
      .then((response) => {
        console.log(response?.data?.data?.[0]);
        localStorage.setItem("accessToken", JSON.stringify(response?.data?.data?.[0]));
        router.push('/');
      })
      .catch((error) => {
        setError(error?.response?.data?.message);
        setTimeout(() => {
          setError("");
        }, 1000);
      });
  };
  return (
    <div className={styles.container}>
      <div className={styles.containerImage}>
        <Image src="/chat-gpt.png" width={50} height={50} alt="GPT Image" />
      </div>
      <div className={styles.containerHeading}>Welcome back</div>
      <div className={styles.inputArea}>
        <Input type="email" id="email" placeholder="Email Address" onChange={(e) => setEmail(e.target.value)} />
        <Input type="password" id="password" placeholder="Password" onChange={(e) => setPassword(e.target.value)} />
      </div>
      <div className={styles.buttonArea}>
        <Button variant="signup" onClick={() => handleLogin()}>Login</Button>
      </div>
      <p>
        Don&apos;t have an account? <a href="/signup">Sign Up</a>
      </p>
      <div className={styles.or}>
        <hr className={styles.line} />
        OR
        <hr className={styles.line} />
      </div>
      <div className={styles.providers}>
        <Link href="https://totkblwvxhejlyboswoq.supabase.co/auth/v1/authorize?provider=google">
        <div className={styles.providerGoogle}>
          <Image src="/google.png" width={40} height={1} alt="Google Image" />
          <p>Continue with Google</p>
        </div>
        </Link>
      </div>
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}
