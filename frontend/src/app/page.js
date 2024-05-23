"use client";
import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";
import styles from "./page.module.css";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import axios from "axios";
import Constants from "@/utils/constants";
import { Spinner } from "@nextui-org/spinner";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default function Home() {
  const [userLoggedIn, setUserLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userDetails, setUserDetails] = useState({});
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [outputValue, setOutputValue] = useState("");
  const [clicked, setClicked] = useState(0);
  const [sse, setsse] = useState("");
  const router = useRouter();
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const [chats, setChats] = useState([]);
  const apiCalledRef = useRef(false);
  const [chatId, setChatId] = useState(null);
  const [button, setButton] = useState(true);
  const [chatHistory, setChatHistory] = useState([]);
  const [hover, setHover] = useState(null);
  const [clickedIndex, setClickedIndex] = useState(null);
  const [isChecked, setIsChecked] = useState(true);
  const [selected, setSelected] = useState(null);
  const [sideMenuHover, setSideMenuHover] = useState(null);
  const [editIconHover, setEditIconHover] = useState(null);

  const handleToggle = () => {
    setIsChecked(!isChecked);
    axios
      .post(`${Constants.API_URL}/${Constants.USER}/toggleDarkMode`, {
        accessToken: userDetails,
        toggle: !isChecked,
      })
      .then((response) => {
        localStorage.setItem(
          "accessToken",
          JSON.stringify(response?.data?.data[0])
        );
        setUserDetails(response?.data?.data[0]);
      });
  };

  const handleDeleteAllChats = () => {
    axios
      .post(`${Constants.API_URL}/${Constants.CHAT}/deleteAllChats`, {
        accessToken: userDetails,
      })
      .then((response) => {
        setChats([]);
        setChatHistory([]);
        setClicked(0);
      })
      .catch((error) => {
        console.log("Failed when deleting all chats", error);
      });
  };

  const updateChats = (chatId) => {
    axios
      .post(`${Constants.API_URL}/${Constants.CHAT}/fetchChats`, {
        accessToken: userDetails,
        chatId,
      })
      .then((res) => {
        setChats(res.data.data);
        setChatId(chatId);
        setClicked(1);
      })
      .catch((error) => {
        console.log("Failed when fetching chats", error);
      });
  };
  const handleDelete = (chatId) => {
    axios
      .post(`${Constants.API_URL}/${Constants.CHAT}/deleteChat`, {
        chatId,
        accessToken: userDetails,
      })
      .then((response) => {
        axios
          .post(`${Constants.API_URL}/${Constants.CHAT}/fetchChatHistory`, {
            accessToken: userDetails,
          })
          .then((res) => {
            setChatHistory(res.data.data);
            setChats((prevItems) => {
              const newItems = [...prevItems];
              newItems.splice(
                newItems.findIndex((item) => item.chat_id === chatId),
                newItems.length
              );
              console.log(newItems);
              return newItems;
            });
          })
          .catch((error) => {
            console.log("Failed when fetching history", error);
          });
      });
  };

  const handleSendMessage = async () => {
    if (inputValue === "") return;
    setButton(false);
    if (chats) {
      setChats([...chats, { prompt: inputValue, response: "" }]);
    } else {
      setChats([{ prompt: inputValue, response: "" }]);
    }
    const accessToken = userDetails;
    let newChatId = chatId;
    if (clicked === 0) {
      axios
        .post(`${Constants.API_URL}/${Constants.CHAT}/newChat`, { accessToken })
        .then((response) => {
          newChatId = response.data.newChatId;
          console.log(response.data);
          console.log(chatHistory);
          setChatId(response.data.newChatId);
          axios
            .post(`${Constants.API_URL}/${Constants.CHAT}/init`, {
              chatId: newChatId,
              prompt: inputValue,
              accessToken: userDetails,
            })
            .then((response) => {
              setsse(JSON.stringify(response.data));
              setClicked(clicked + 1);
            });
        });
    } else {
      axios
        .post(`${Constants.API_URL}/${Constants.CHAT}/init`, {
          chatId: newChatId,
          prompt: inputValue,
          accessToken: userDetails,
        })
        .then((response) => {
          setsse(JSON.stringify(response.data));
          setClicked(clicked + 1);
        });
    }
  };

  const handleNewChat = () => {
    setInputValue("");
    setChats([]);
    setClicked(0);
    setOutputValue("");
    setChatId(null);
    setSelected(null);
  };

  const handleLogOut = () => {
    setUserLoggedIn(false);
    setChatId(null);
    setChats([]);
    setChatHistory([]);
    const accessToken = userDetails;
    setUserDetails({});
    setIsChecked(true);
    localStorage.removeItem("accessToken");
    axios
      .post(`${Constants.API_URL}/${Constants.USER}/logout`, { accessToken })
      .then((response) => {
        router.push("/");
        console.log("Logout successful:", response.data);
      })
      .catch((error) => {
        console.error("Logout failed:", error);
      });
  };

  const handleEditMenu = (index) => {
    if (clickedIndex !== null) {
      setClickedIndex(null);
    } else {
      setClickedIndex(index);
    }
  };
  useEffect(() => {
    if (apiCalledRef.current) return;
    if (localStorage.getItem("accessToken")) {
      const accessToken = JSON.parse(localStorage.getItem("accessToken"));
      setUserDetails(accessToken);
      setUserLoggedIn(true);
      setIsChecked(accessToken.dark_mode);
      axios
        .post(`${Constants.API_URL}/${Constants.CHAT}/fetchChatHistory`, {
          accessToken,
        })
        .then((res) => {
          setChatHistory(res.data.data);
        })
        .catch((error) => {
          console.log("Failed when fetching history", error);
        });
    }
    apiCalledRef.current = true;
    const hash = window.location.hash;
    const params = new URLSearchParams(hash.slice(1));
    const accessToken = params.get("access_token");
    if (accessToken) {
      axios
        .post(`${Constants.API_URL}/${Constants.USER}/verify-token`, {
          accessToken,
        })
        .then((response) => {
          localStorage.setItem(
            "accessToken",
            JSON.stringify(response?.data?.data[0])
          );
          setUserDetails(response?.data?.data[0]);
          setUserLoggedIn(true);
          axios
            .post(`${Constants.API_URL}/${Constants.CHAT}/fetchChatHistory`, {
              accessToken: response?.data?.data[0],
            })
            .then((res) => {
              setChatHistory(res.data.data);
            })
            .catch((error) => {
              console.log("Failed when fetching history", error);
            });
          setLoading(false);
        })
        .catch((error) => {
          console.error("Token verification failed:", error);
        });
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (sse === "") return;
    console.log(JSON.parse(sse));
    const eventSource = new EventSource(
      `${Constants.API_URL}/${Constants.CHAT}${JSON.parse(sse).sseUrl}`
    );
    setInputValue("");
    eventSource.onmessage = function (event) {
      if (event.data === "[DONE]") {
        eventSource.close();
        setSelected(chatId);
        axios
          .post(`${Constants.API_URL}/${Constants.CHAT}/fetchChatHistory`, {
            accessToken: userDetails,
          })
          .then((res) => {
            setChatHistory(res.data.data);
          })
          .catch((error) => {
            console.log("Failed when fetching history", error);
          });
        setButton(true);
      } else {
        console.log(event.data);

        setOutputValue((prev) => {
          // Avoid duplicating data by checking if the new data is already included
          if (!prev.endsWith(event.data + "\n")) {
            return prev + event.data + "\n";
          }
          return prev;
        });

        setChats((prevItems) => {
          if (prevItems?.length > 0) {
            const newItems = [...prevItems];
            if (newItems[newItems.length - 1].response === "") {
              newItems[newItems.length - 1].response = event.data;
            } else if (
              !newItems[newItems.length - 1].response.endsWith(event.data)
            ) {
              newItems[newItems.length - 1].response += event.data;
            }
            return newItems;
          }
          return prevItems;
        });

        if (messagesEndRef.current) {
          messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
      }
    };

    eventSource.onerror = function (event) {
      console.error("EventSource failed:", event);
      eventSource.close();
    };
  }, [clicked]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        handleSendMessage();
      }
    };

    const inputElement = inputRef.current;
    if (inputElement) {
      inputElement.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      if (inputElement) {
        inputElement.removeEventListener("keydown", handleKeyDown);
      }
    };
  }, [inputValue]);

  useEffect(() => {
    const root = window.document.documentElement;
    if (isChecked) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [isChecked]);

  const transformTextToMarkdown = (text) => {
    let response = text
      .replace(/\*\*\*(.+?)\*\*\*/g, "\n### $1\n")
      .replace(/\*\*(.+?)\*\*/g, "\n## $1\n")
      .replace(/\*(.+?)\*/g, "\n# $1\n");
    response = response.replace(/\*/g, '');
    return response;
  };

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
        <div>
          <div className={styles.newChat} onMouseEnter={() => setEditIconHover(0)} onMouseLeave={() => setEditIconHover(null)}>
            {isChecked && (
              <div className={styles.newChatMainText} onClick={handleNewChat}>
                <Image
                  src="/gptImage.png"
                  width={20}
                  height={20}
                  alt="GPT Image"
                />
                &nbsp;&nbsp;New Chat
              </div>
            )}
            {!isChecked && (
              <div className={styles.newChatMainText} onClick={handleNewChat}>
                <Image
                  src="/chat-gpt.png"
                  width={20}
                  height={20}
                  alt="GPT Image"
                />
                &nbsp;&nbsp;New Chat
              </div>
            )}
            <div className={styles.newChatMainImage}>
              {editIconHover != 0 && (<Image src="/edit.png" width={15} height={15} alt="Edit Image"/>)}
              {editIconHover == 0 && (<Image src="/edit-dark.png" width={15} height={15} alt="Edit Image"/>)}
            </div>
          </div>
          {chatHistory.length > 0 &&
            chatHistory.map((chat, index) => (
              <div
                className={
                  selected === chat.chat_id
                    ? styles.chatHistorySelected
                    : styles.chatHistory
                }
                key={index}
                onMouseEnter={() => setHover(index)}
                onMouseLeave={() => {
                  setHover(null);
                  setClickedIndex(null);
                }}
                onClick={() => {
                  updateChats(chat.chat_id);
                  setSelected(chat.chat_id);
                }}
              >
                <div className={styles.chatHistoryValues}>{`${chat.prompt.slice(
                  0,
                  20
                )}`}</div>
                <div
                  className={styles.newChatMainImage}
                  onClick={() => handleEditMenu(index)}
                >
                  {hover == index && isChecked && (
                    <Image
                      src="/more.png"
                      width={15}
                      height={15}
                      alt="More Image"
                    />
                  )}
                  {hover == index && !isChecked && (
                    <Image
                      src="/more-dark.png"
                      width={15}
                      height={15}
                      alt="More Image"
                    />
                  )}
                  {clickedIndex == index && (
                    <div className={styles.editMenu}>
                      <div
                        className={styles.editMenuItem}
                        onClick={() => handleDelete(chat.chat_id)}
                      >
                        <div className={styles.editMenuItemImage}>
                          <Image
                            src="/delete.png"
                            width={15}
                            height={15}
                            alt="Delete Image"
                          />
                        </div>
                        <div>Delete</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
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
                  <div
                    className={styles.dropdownItem}
                    onMouseEnter={() => setSideMenuHover(0)}
                    onMouseLeave={() => setSideMenuHover(null)}
                  >
                    {sideMenuHover != 0 && (
                      <Image
                        src="/setting.png"
                        width={20}
                        height={20}
                        alt="Edit Image"
                      />
                    )}
                    {sideMenuHover == 0 && (
                      <Image
                        src="/setting-dark.png"
                        width={20}
                        height={20}
                        alt="Edit Image"
                      />
                    )}
                    <div className={styles.dropdownItemText}>
                      <Dialog>
                        <DialogTrigger asChild>
                          <div>Settings</div>
                        </DialogTrigger>
                        <DialogContent className={styles.dialogContent}>
                          <DialogHeader>
                            <DialogTitle className="pb-3">Settings</DialogTitle>
                          </DialogHeader>
                          <div className={styles.dialogContentBox}>
                            <div className={styles.dialogContentBoxMenuItems}>
                              <div className={styles.dialogContentBoxMenuItem}>
                                <Image
                                  src="/setting.png"
                                  width={15}
                                  height={15}
                                  alt="Edit Image"
                                />
                                <div>General</div>
                              </div>
                            </div>
                            <div
                              className={styles.dialogContentBoxContentItems}
                            >
                              <div
                                className={styles.dialogContentBoxContentItem}
                              >
                                <div
                                  className={
                                    styles.dialogContentBoxContentItemLabel
                                  }
                                >
                                  Dark Mode
                                </div>
                                <div>
                                  <label className="inline-flex items-center cursor-pointer">
                                    <input
                                      type="checkbox"
                                      className="sr-only peer"
                                      checked={isChecked}
                                      onChange={handleToggle}
                                    />
                                    <div className="relative w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                                  </label>
                                </div>
                              </div>
                              <div
                                className={styles.dialogContentBoxContentItem}
                              >
                                <div
                                  className={
                                    styles.dialogContentBoxContentItemLabel
                                  }
                                >
                                  Delete Chat History
                                </div>
                                <div onClick={handleDeleteAllChats}>
                                  <Button variant="destructive">Delete</Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                  <div
                    className={styles.dropdownItem}
                    onClick={handleLogOut}
                    onMouseEnter={() => setSideMenuHover(1)}
                    onMouseLeave={() => setSideMenuHover(null)}
                  >
                    {sideMenuHover != 1 && (
                      <Image
                        src="/logout.png"
                        width={20}
                        height={20}
                        alt="Edit Image"
                      />
                    )}
                    {sideMenuHover == 1 && (
                      <Image
                        src="/logout-dark.png"
                        width={20}
                        height={20}
                        alt="Edit Image"
                      />
                    )}
                    <div className={styles.dropdownItemText}>
                      <p>Log out</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
        <div className={styles.chatBody}>
          <div>
            {(!chats || chats.length === 0) && (
              <div className={styles.messageArea}>
                {isChecked && (
                  <Image
                    src="/gptImage.png"
                    width={50}
                    height={50}
                    alt="GPT Image"
                  />
                )}
                {!isChecked && (
                  <Image
                    src="/chat-gpt.png"
                    width={50}
                    height={50}
                    alt="GPT Image"
                  />
                )}
                <p>How can I help you today?</p>
              </div>
            )}
          </div>
          {chats?.length > 0 &&
            chats.map((chat, index) => (
              <div className={styles.messagesArea} key={index}>
                <div className={styles.promptArea}>
                  <p>{chat.prompt}</p>
                </div>
                <div className={styles.outputArea}>
                  <div className={styles.outputAreaImage}>
                    {isChecked && (
                      <Image
                        src="/gptImage.png"
                        width={25}
                        height={25}
                        alt="GPT Image"
                      />
                    )}
                    {!isChecked && (
                      <Image
                        src="/chat-gpt.png"
                        width={25}
                        height={25}
                        alt="GPT Image"
                      />
                    )}
                  </div>
                  <div className={styles.outputAreaText}>
                    <p>
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                          h1: ({ children }) => (
                            <h1 className={styles.header1}>{children}</h1>
                          ),
                          h2: ({ children }) => (
                            <h2 className={styles.header2}>{children}</h2>
                          ),
                          h3: ({ children }) => (
                            <h3 className={styles.header3}>{children}</h3>
                          ),
                        }}
                      >
                        {transformTextToMarkdown(chat.response)}
                      </ReactMarkdown>
                    </p>
                  </div>
                </div>
              </div>
            ))}
          <div className={styles.inputArea}>
            <input
              type="text"
              placeholder="Message ChatGPT"
              value={inputValue}
              ref={inputRef}
              onChange={(e) => setInputValue(e.target.value)}
            />
            <div className={styles.submitButton}>
              <button onClick={handleSendMessage}>
                {!button && (
                  <Image src="/stop-button.png" width={18} height={18} />
                )}
                {button && <Image src="/up-arrow.png" width={18} height={18} />}
              </button>
            </div>
          </div>
          <p className={styles.termsAndCondition}>
            ChatGPT can make mistakes. Check important info.
          </p>
          <div ref={messagesEndRef} />
        </div>
      </div>
    </div>
  );
}
