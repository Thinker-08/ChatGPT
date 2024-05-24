"use client";
import React, { useState } from "react";
import styles from "./page.module.css";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import axios from "axios";
import Constants from "@/utils/constants";
import { useRouter } from "next/navigation";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const AboutYou = () => {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [birthday, setBirthday] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();
  const handleContinue = async () => {
    const accessToken = localStorage.getItem('accessToken');
    axios.post(`${Constants.API_URL}/${Constants.USER}/update-user`, {
        firstName: firstName,
        lastName: lastName,
        accessToken: JSON.parse(accessToken),
      })
      .then((res) => {
        console.log(res?.data?.data?.[0]);
        localStorage.setItem("accessToken", JSON.stringify(res?.data?.data?.[0]));
        router.push('/');
      })
      .catch((error) => {
        setError("Please enter valid email and password");
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
      <div className={styles.containerHeading}>Tell us about you</div>
      <div className={styles.inputArea}>
        <Input
          type="text"
          id="name"
          placeholder="First Name"
          onChange={(e) => setFirstName(e.target.value)}
        />
        <Input
          type="text"
          id="name"
          placeholder="Last Name"
          onChange={(e) => setLastName(e.target.value)}
        />
      </div>
      <div className={styles.inputArea}>
        <Input
          type="date"
          id="date"
          placeholder="Birthday (MM/DD/YYYY)"
          onChange={(e) => setBirthday(e.target.value)}
        />
      </div>
      <div className={styles.buttonArea}>
        <Button variant="signup" onClick={handleContinue}>
          Continue
        </Button>
      </div>
      <div className={styles.description}>
        <p>
          By clicking &quot;Continue&quot;, you agree to our{" "}
          <a href="https://openai.com/policies/terms-of-use/">
            Terms of Service
          </a>{" "}
          <br />
          and acknowledgement of our{" "}
          <a href="https://openai.com/policies/terms-of-use/">Privacy Policy</a>
          .
        </p>
      </div>
      <div className={styles.footer}>
        <a>Terms of use</a> | <a>Privacy Policy</a>
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
};

export default AboutYou;
