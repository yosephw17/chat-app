import React, { useState, useEffect } from "react";
import {
  Box,
  Button,
  IconButton,
  VStack,
  Text,
  useToast,
} from "@chakra-ui/react";
import { PhoneIcon } from "@chakra-ui/icons";
import SingleChat from "./SingleChat";
import VideoCall from "./VideoCall";
import { ChatState } from "../Context/ChatProvider";
import io from "socket.io-client";

const ENDPOINT = "http://localhost:5000"; // Change to your server endpoint
const socket = io(ENDPOINT);

const Chatbox = ({ fetchAgain, setFetchAgain }) => {
  const { selectedChat } = ChatState();
  const [inCall, setInCall] = useState(false);
  const toast = useToast();

  useEffect(() => {
    if (selectedChat) {
      // Join the chat room
      socket.emit("join chat", selectedChat._id);

      // Listen for the call-ended event
      socket.on("callEnded", (data) => {
        console.log("Call ended event received:", data);

        toast({
          title: "Call Ended",
          description:
            data.message || "The call has been ended by the other user.",
          status: "info",
          duration: 5000,
          isClosable: true,
        });
      });

      // Listen for missed call event
      socket.on("missedCall", (message) => {
        toast({
          title: "Missed Call",
          description: message || "You missed a call.",
          status: "warning",
          duration: 5000,
          isClosable: true,
        });
      });

      // Listen for incoming messages
      socket.on("messageReceived", (message) => {
        toast({
          title: "New Message",
          description: message.message,
          status: "info",
          duration: 5000,
          isClosable: true,
        });
      });
    }

    return () => {
      socket.off("callEnded");
      socket.off("missedCall");
      socket.off("messageReceived");
    };
  }, [selectedChat, toast]);

  const handleEndCall = () => {
    setInCall(false);

    // Emit 'endCall' event when ending the call
    socket.emit("endCall", { room: selectedChat._id });

    // Emit missed call message
    if (selectedChat) {
      socket.emit("sendMessage", {
        room: selectedChat._id,
        message: `Missed call from ${selectedChat.chatName}`,
        sender: selectedChat.chatName,
        timestamp: new Date().toISOString(),
      });
    }
  };

  const handleToggleCall = () => {
    // Check if a user (chat) is selected before toggling the call
    if (!selectedChat) {
      toast({
        title: "No User Selected",
        description: "Please select a user to start the call.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    console.log("Toggling Call, Current inCall state: ", inCall);
    setInCall(!inCall);
  };

  return (
    <Box
      display={{ base: selectedChat ? "flex" : "none", md: "flex" }}
      flexDir="column"
      alignItems="center"
      p={3}
      bg="white"
      w={{ base: "100%", md: "68%" }}
      borderRadius="lg"
      borderWidth="1px"
      boxShadow="lg"
    >
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        w="100%"
        mb={3}
        p={2}
        borderBottom="1px solid"
        borderColor="gray.200"
      >
        <Text fontSize="xl" fontWeight="bold" color="teal.600">
          {selectedChat ? selectedChat.chatName : "Chat"}
        </Text>
        <IconButton
          icon={<PhoneIcon />}
          colorScheme="teal"
          onClick={handleToggleCall}
          aria-label="Toggle Video Call"
          size="md"
        />
      </Box>

      {inCall && (
        <VStack
          spacing={4}
          w="100%"
          bg="gray.50"
          p={4}
          borderRadius="md"
          mb={4}
          boxShadow="sm"
        >
          <VideoCall setInCall={setInCall} />
          <Button
            colorScheme="red"
            onClick={handleEndCall}
            size="sm"
            variant="outline"
          >
            End Video Call
          </Button>
        </VStack>
      )}

      <SingleChat fetchAgain={fetchAgain} setFetchAgain={setFetchAgain} />
    </Box>
  );
};

export default Chatbox;
