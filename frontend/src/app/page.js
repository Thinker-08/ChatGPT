"use client";
import React, { useState, useRef, useEffect,  } from "react";
import Image from "next/image";
import styles from "./page.module.css";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import axios from "axios";
import Constants from "@/utils/constants";
import { Spinner } from "@nextui-org/spinner";
import { useRouter } from 'next/navigation';

export default function Home() {
  const [message, setMessage] = useState("");
  const [userLoggedIn, setUserLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userDetails, setUserDetails] = useState({});
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [outputValue, setOutputValue] = useState("");
  const [clicked, setClicked] = useState(0);

  const router = useRouter();
  const handleSendMessage = () => {
    setClicked(clicked + 1);
  };

  const handleLogOut = () => {
    setUserLoggedIn(false);
    const accessToken = userDetails;
    setUserDetails({});
    localStorage.removeItem("accessToken");
    axios
      .post(`${Constants.API_URL}/${Constants.USER}/logout`, { accessToken })
      .then((response) => {
        router.push('/');
        console.log("Logout successful:", response.data);
      })
      .catch((error) => {
        console.error("Logout failed:", error);
      });
  };
  const apiCalledRef = useRef(false);

  useEffect(() => {
    if (apiCalledRef.current) return;
    if (localStorage.getItem("accessToken")) {
      setUserDetails(JSON.parse(localStorage.getItem("accessToken")));
      setUserLoggedIn(true);
    }
    apiCalledRef.current = true;
    const hash = window.location.hash;
    const params = new URLSearchParams(hash.slice(1));
    const accessToken = params.get("access_token");
    if (accessToken) {
      axios.post(`${Constants.API_URL}/${Constants.USER}/verify-token`, {
          accessToken,
        })
        .then((response) => {
          localStorage.setItem("accessToken", JSON.stringify(response?.data?.data[0]));
          setUserDetails(response?.data?.data[0]);
          setUserLoggedIn(true);
        })
        .catch((error) => {
          console.error("Token verification failed:", error);
        });
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    const eventSource = new EventSource(`${Constants.API_URL}/${Constants.CHAT}/openAiChat?prompt=${inputValue}`);
    eventSource.onmessage = function(event) {
        setOutput(prev => prev + event.data);
    };
    setInputValue("");
    eventSource.addEventListener('end', function() {
        eventSource.close();
    });
    return () => {
        eventSource.close();
    };
}, [clicked]);

  if (loading) {
    return (
      <div className={styles.loader}>
        <Spinner color="success" />
      </div>
    );
  }
  return (
    <div className={styles.container}>
      <div
        className={styles.navbarContainer}
        onClick={() => setDropdownOpen(false)}
      >
        <div className={styles.newChat}>
          <div className={styles.newChatMainText}>
            <Image src="/gptImage.png" width={20} height={20} alt="GPT Image" />
            &nbsp;&nbsp;New Chat
          </div>
          <div className={styles.newChatMainImage}>
            <Image src="/edit.png" width={15} height={15} alt="Edit Image" />
          </div>
        </div>
        {!userLoggedIn && (
          <div className={styles.signUpAndLogin}>
            <div className={styles.heading}>Sign up or log in</div>
            <div className={styles.content}>
              Save your chat history, share chats, and personalize your
              experience.
            </div>
            <Link href="/signup">
              <div className={styles.signUpButtons}>
                <Button variant="signup">Signup</Button>
              </div>
            </Link>
            <Link href="/login">
              <div className={styles.loginButtons}>
                <Button variant="login">Log in</Button>
              </div>
            </Link>
          </div>
        )}
      </div>
      <div className={styles.chatContainer}>
        <div className={styles.chatHeader}>
          ChatGPT 3.5
          {userLoggedIn && (
            <div className={styles.dropdown}>
              <Image
                src={userDetails.img_url}
                width={30}
                height={30}
                alt="Dropdown"
                onClick={() => setDropdownOpen(!dropdownOpen)}
              />
              {dropdownOpen && (
                <div className={styles.dropdownItems}>
                  <div className={styles.dropdownItem} onClick={handleLogOut}>
                    <Image
                      src="/logout.png"
                      width={20}
                      height={20}
                      alt="Edit Image"
                    />
                    <div className={styles.dropdownItemText}>
                      <p>Log out</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
        <div>
          {clicked === 0 && ( <div className={styles.messageArea}>
            <Image src="/gptImage.png" width={50} height={50} alt="GPT Image" />
            <p>How can I help you today?</p>
          </div>)}
          {clicked !==0 && ( <div className={styles.messageArea}>
            hi
          </div>)}
        </div>
        <div className={styles.inputArea}>
          <input
            type="text"
            placeholder="Message ChatGPT"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
          <button onClick={handleSendMessage}>Send</button>
        </div>
        <p className={styles.termsAndCondition}>
          ChatGPT can make mistakes. Check important info.
        </p>
      </div>
    </div>
  );
}
