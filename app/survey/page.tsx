"use client";

import React, { useState, useRef, useEffect } from "react";
import StreamingAvatar from "@heygen/streaming-avatar";
import {
  AvatarQuality,
  TaskMode,
  TaskType,
  StreamingEvents,
} from "@heygen/streaming-avatar";
import { IoMicOutline, IoMicOffSharp } from "react-icons/io5";

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

const TakeASurvey = () => {
  const [isLoadingSession, setIsLoadingSession] = useState(false);
  const [userName, setUserName] = useState("");
  const [isSurveyInProgress, setIsSurveyInProgress] = useState(false);
  const [isAvatarSpeaking, setIsAvatarSpeaking] = useState(true);
  const [chatInput, setChatInput] = useState(""); // Text input for chat
  const [isListening, setIsListening] = useState(false); // Listening state

  const isIntro = useRef(true); // Replacing useState with useRef
  const currentQuestionIndex = useRef(0); // Replacing useState with useRef
  const ischeckText = useRef(false);
  const k = useRef(0);
  const questions = [
    "Little interest or pleasure in doing things?",
    "Feeling down, depressed, or hopeless?",
    "Trouble falling or staying asleep, or sleeping too much?",
    "Feeling tired or having little energy",
    "Poor appetite or overeating",
    "Feeling bad about yourself or that you are a failure or have let yourself or your family down",
    "Trouble concentrating on things, such as reading the newspaper or watching television",
    "Moving or speaking so slowly that other people could have noticed? Or the opposite — being so fidgety or restless that you have been moving around a lot more than usual",
    "Thoughts that you would be better off dead or of hurting yourself in some way",
  ];

  const avatarRef = useRef<StreamingAvatar | null>(null);
  const mediaStream = useRef<HTMLVideoElement>(null);

  const fetchAccessToken = async () => {
    const response = await fetch("/api/get-access-token", { method: "POST" });
    if (response.ok) {
      return await response.text();
    }
    throw new Error("Failed to fetch access token");
  };

  useEffect(() => {
    if (chatInput !== "") {
      ischeckText.current = true;
    }
  });
  const startAvatarSession = async () => {
    setIsLoadingSession(true);

    try {
      const accessToken = await fetchAccessToken();

      avatarRef.current = new StreamingAvatar({
        token: accessToken,
      });

      // Handle avatar start talking event
      avatarRef.current.on(StreamingEvents.AVATAR_START_TALKING, () => {
        setIsAvatarSpeaking(true);
      });

      // Handle avatar stop talking event
      avatarRef.current.on(StreamingEvents.AVATAR_STOP_TALKING, () => {
        setIsAvatarSpeaking(false);

        // Check if browser supports speech recognition
        if (
          !(
            "SpeechRecognition" in window || "webkitSpeechRecognition" in window
          )
        ) {
          alert(
            "Your browser does not support speech recognition. Please type your answer."
          );
          return;
        }

        const SpeechRecognition =
          window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognition = new SpeechRecognition();

        recognition.lang = "en-US";
        recognition.interimResults = false;
        recognition.continuous = false;

        let silenceTimeout: any; // Timer for detecting silence

        // Start listening for speech
        recognition.start();
        setIsListening(true);

        // Reset silence timeout
        const resetSilenceTimeout = () => {
          clearTimeout(silenceTimeout);
          silenceTimeout = setTimeout(() => {
            if (ischeckText.current) {
              recognition.stop();
              setIsListening(false);
            }

            // Stop recognition after silence
          }, 2000); // 3-second timeout
        };

        resetSilenceTimeout();
        // Handle speech results
        recognition.onresult = async (event: any) => {
          // Reset silence timeout on valid speech

          const voiceAnswer = event.results[0][0].transcript;
          setIsListening(false);
          if (voiceAnswer.trim() !== "") {
            await saveResponse(voiceAnswer, recognition);
          } else {
            await speakMessage(
              "I didn't catch that. Could you repeat your answer?"
            );
          }

          // Stop recognition if it's the last question
          if (currentQuestionIndex.current === questions.length - 1) {
            recognition.stop();
          }
        };

        // Handle recognition errors
        recognition.onerror = (event: any) => {
          setIsListening(false);
          clearTimeout(silenceTimeout); // Clear timer on error
          console.error("Speech recognition error:", event.error);
          // alert("Could not process your voice input. Please try again.");
        };

        // Stop recognition on end
        recognition.onend = () => {
          setIsListening(false);
          clearTimeout(silenceTimeout);
        };
      });

      // Handle stream ready event
      avatarRef.current.on(StreamingEvents.STREAM_READY, (event) => {
        if (mediaStream.current) {
          mediaStream.current.srcObject = event.detail;
          mediaStream.current.play();
        }
      });

      // Start avatar session
      await avatarRef.current.createStartAvatar({
        quality: AvatarQuality.High,
        avatarName: "Wayne_20240711", // Replace with your HeyGen Avatar ID
        disableIdleTimeout: true,
      });
    } catch (error) {
      console.error("Failed to start avatar session:", error);
      alert("An error occurred while starting the avatar session.");
    } finally {
      setIsLoadingSession(false);
    }
  };

  const speakMessage = async (message: any) => {
    if (!avatarRef.current) return;
    await avatarRef.current.speak({
      text: message,
      taskType: TaskType.REPEAT,
      taskMode: TaskMode.SYNC,
    });
  };

  const startSurvey = async () => {
    if (!userName.trim()) {
      alert("Please enter your name");
      return;
    }

    try {
      const response = await fetch("/api/savesurvey", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userName }),
      });

      if (response.ok) {
        setIsSurveyInProgress(true);
        await startAvatarSession();
        await speakMessage(
          `Hello ${userName}! I am here to guide you through the Personal Health Questionnaire. Are you ready to begin? Please answer in Yes or No.`
        );
      } else {
        console.error("Failed to initialize survey");
      }
    } catch (error) {
      console.error("Error starting survey:", error);
    }
  };

  const saveResponse = async (response: string, recognition?: any) => {
    if (isIntro.current) {
      if (
        response.toLowerCase().includes("yes") ||
        response.toLowerCase().includes("yes i am ready")
      ) {
        isIntro.current = false;
        ischeckText.current = false;
        setIsSurveyInProgress(true);
        speakMessage(questions[currentQuestionIndex.current]);
      } else {
        speakMessage("Alright, let me know when you're ready to start.");
      }
      return;
    }

    try {
      const result = await fetch("/api/savesurvey", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userName,
          responses: [
            {
              question: questions[currentQuestionIndex.current],
              answer: response,
            },
          ],
        }),
      });

      if (result.ok) {
        ischeckText.current = false;

        if (currentQuestionIndex.current < questions.length - 1) {
          currentQuestionIndex.current += 1;
          speakMessage(questions[currentQuestionIndex.current]);
        } else {
          if (k.current <= 0) {
            await speakMessage(
              `Great, ${userName}, you've completed the patient health questionnaire! You're all done for now.`
            );
            k.current += 1;
          }

          setTimeout(() => {
            setIsSurveyInProgress(false);
          }, 12000);
        }
      } else {
        console.error("Failed to save response");
      }
    } catch (error) {
      console.error("Error saving response:", error);
    }
  };

  const handleTextAnswer = async () => {
    setIsListening(false);
    ischeckText.current = true;
    if (chatInput.trim() === "") {
      await speakMessage(
        "I didn't catch that. Could you please type your answer?"
      );
      return;
    }

    setChatInput("");
    await saveResponse(chatInput);
  };

  const handleVoiceAnswer = async () => {
    if (
      !("SpeechRecognition" in window || "webkitSpeechRecognition" in window)
    ) {
      alert(
        "Your browser does not support speech recognition. Please type your answer."
      );
      return;
    }

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.continuous = false;

    setIsListening(true);
    recognition.start();

    recognition.onresult = async (event: any) => {
      const voiceAnswer = event.results[0][0].transcript;
      setIsListening(false);

      if (voiceAnswer.trim() !== "") {
        await saveResponse(voiceAnswer, recognition);
      } else {
        await speakMessage(
          "I didn't catch that. Could you repeat your answer?"
        );
      }
    };

    recognition.onerror = (event: any) => {
      setIsListening(false);
      // alert("Could not process your voice input. Please try again.");
    };
  };

  useEffect(() => {
    return () => {
      avatarRef.current?.stopAvatar();
    };
  }, []);

  return (
    <div
      style={{
        color: "#fff",
        minHeight: "100vh",
        padding: "20px",
      }}
    >
      <h1
        style={{
          textAlign: "center",
          fontSize: "2.5rem",
          marginBottom: "20px",
          color: "#FFD700",
        }}
      >
        Take a Survey
      </h1>
      {!isSurveyInProgress ? (
        <div style={{ textAlign: "center" }}>
          <input
            type="text"
            placeholder="Enter your name"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            style={{
              padding: "10px",
              width: "300px",
              fontSize: "1rem",
              borderRadius: "5px",
              border: "1px solid #444",
              backgroundColor: "#222",
              color: "#fff",
              marginBottom: "20px",
            }}
          />
          <br />
          <button
            onClick={startSurvey}
            disabled={isLoadingSession}
            style={{
              padding: "10px 20px",
              fontSize: "1rem",
              borderRadius: "5px",
              backgroundColor: "#FFD700",
              color: "#000",
              fontWeight: "bold",
              cursor: "pointer",
              border: "none",
              marginTop: "10px",
            }}
          >
            {isLoadingSession ? "Loading..." : "Start Survey"}
          </button>
        </div>
      ) : (
        <div style={{ textAlign: "center" }}>
          <p style={{ fontSize: "1.5rem", marginBottom: "20px" }}>
            Survey in progress...
          </p>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "20px",
            }}
          >
            <video
              ref={mediaStream}
              autoPlay
              playsInline
              style={{
                width: "80%",
                height: "auto",
                border: "2px solid #FFD700",
                borderRadius: "10px",
              }}
            >
              <track kind="captions" />
            </video>
            {/* Note for the user */}
            <p
              style={{
                fontSize: "1rem",
                color: "#FFD700",
                textAlign: "center",
                marginBottom: "10px",
              }}
            >
              Please enable your microphone to answer the survey questions. You
              can also type your answers in the input field below.
            </p>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                width: "80%",
              }}
            >
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Type your answer here..."
                style={{
                  flex: "1",
                  padding: "10px",
                  borderRadius: "5px",
                  border: "1px solid #444",
                  backgroundColor: "#222",
                  color: "#fff",
                }}
              />
              <button
                onClick={handleTextAnswer}
                style={{
                  padding: "10px 20px",
                  backgroundColor: "#FFD700",
                  color: "#000",
                  border: "none",
                  borderRadius: "5px",
                  fontWeight: "bold",
                  cursor: "pointer",
                }}
                disabled={isAvatarSpeaking}
              >
                Submit
              </button>
              {/* Mic Icon */}
              <button
                onClick={isListening ? undefined : handleVoiceAnswer}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "50px",
                  height: "50px",
                  borderRadius: "50%",
                  backgroundColor: isListening ? "#FFD700" : "#444",
                  cursor: isListening ? "not-allowed" : "pointer",
                }}
                disabled={isAvatarSpeaking}
              >
                {isListening ? (
                  <IoMicOffSharp color="#000" size={24} />
                ) : (
                  <IoMicOutline color="#fff" size={24} />
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TakeASurvey;
