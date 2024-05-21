"use client";
import React, { useState } from "react";
import styles from "./page.module.css";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import axios from "axios";
import Constants from "@/utils/constants";
import { useRouter } from 'next/navigation';

export default function Signup() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const router = useRouter();
  const handleSignup = () => {
    if (email === "" || password === "" || !regex.test(email)) {
      setError("Please enter valid email and password");
      setTimeout(() => {
        setError("");
      }, 1000);
    }
    const data = {
      email,
      password,
    };
    axios.post(`${Constants.API_URL}/${Constants.USER}/signup`, data)
      .then((response) => {
        console.log(response?.data?.data?.[0]);
        localStorage.setItem("accessToken", JSON.stringify(response?.data?.data?.[0]));
        router.push('/aboutyou');
      })
      .catch((error) => {
        setError(error?.response?.data?.error);
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
      <div className={styles.containerHeading}>Create an account</div>
      <div className={styles.inputArea}>
        <Input
          type="email"
          id="email"
          placeholder="Email Address"
          onChange={(e) => setEmail(e.target.value)}
        />
        <Input
          type="password"
          id="password"
          placeholder="Password"
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>
      <div className={styles.buttonArea}>
        <Button variant="signup" onClick={handleSignup}>
          Signup
        </Button>
      </div>
      <p>
        Already have an account? <a href="/login">Login</a>
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
