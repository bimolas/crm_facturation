"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "motion/react";
import { Search, MoreVertical, Send, CheckCircle2, User, Phone, Video } from "lucide-react";
import { clsx } from "clsx";
import { api } from "@/utils/api";
import { useAuth } from "@/context/AuthContext";

export function MessagesView() {
  const { user, company } = useAuth();
  const [conversations, setConversations] = useState<any[]>([]);
  const [activePartnerId, setActivePartnerId] = useState<number | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const data = await api.get("/messages/conversations");
        setConversations(data);
        if (data.length > 0) {
          setActivePartnerId(data[0].id);
        }
      } catch (error) {
        console.error("Failed to load conversations:", error);
      }
    };
    fetchConversations();
  }, []);

  useEffect(() => {
    const fetchMessages = async () => {
      if (activePartnerId) {
        try {
          const data = await api.get(`/messages/partner/${activePartnerId}`);
          setMessages(data);
          setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
          }, 100);
        } catch (error) {
          console.error("Failed to load messages:", error);
        }
      } else {
        setMessages([]);
      }
    };
    fetchMessages();
  }, [activePartnerId]);

  const handleSendMessage = async () => {
    if (!inputText.trim() || !activePartnerId) return;

    try {
      const newMessage = await api.post("/messages", {
        receiverCompanyId: activePartnerId,
        content: inputText.trim()
      });
      setMessages([...messages, newMessage]);
      setInputText("");
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };

  const activePartner = conversations.find(c => c.id === activePartnerId);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-[calc(100vh-140px)] w-full max-w-[1600px] mx-auto pb-6">
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden h-full flex">
         {/* Sidebar List */}
         <div className="w-80 border-r border-slate-200 flex flex-col bg-slate-50 shrink-0">
            <div className="p-4 border-b border-slate-200 bg-white">
               <h2 className="font-bold text-slate-900 mb-3 text-lg">Messages</h2>
               <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input type="text" placeholder="Search chats..." className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 bg-slate-50 focus:bg-white transition-colors" />
               </div>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
               {conversations.length === 0 && (
                 <div className="text-center text-sm text-slate-500 mt-4">No active conversations found.</div>
               )}
               {conversations.map((chat) => (
                  <div 
                     key={chat.id} 
                     onClick={() => setActivePartnerId(chat.id)}
                     className={clsx(
                        "p-3 rounded-lg cursor-pointer transition-colors flex items-center space-x-3",
                        activePartnerId === chat.id ? "bg-white shadow-sm border border-slate-200" : "hover:bg-slate-100 border border-transparent"
                     )}
                  >
                     <div className="relative">
                        <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center shrink-0">
                           <User className="w-5 h-5 text-slate-500" />
                        </div>
                     </div>
                     <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center mb-0.5">
                           <p className="text-sm font-bold text-slate-900 truncate">{chat.name}</p>
                        </div>
                        <div className="flex justify-between items-center">
                           <p className="text-xs text-slate-500 truncate">{chat.ice}</p>
                        </div>
                     </div>
                  </div>
               ))}
            </div>
         </div>

         {/* Chat Area */}
         <div className="flex-1 flex flex-col bg-white min-w-0">
            {activePartner ? (
              <>
                <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between shrink-0">
                   <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
                         <User className="w-5 h-5 text-slate-500" />
                      </div>
                      <div>
                         <h3 className="font-bold text-slate-900 leading-tight">{activePartner.name}</h3>
                         <p className="text-xs text-green-600 font-medium flex items-center">Partner Company</p>
                      </div>
                   </div>
                   <div className="flex items-center space-x-2">
                      <button className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-slate-100 text-slate-600 transition-colors"><Phone className="w-4 h-4" /></button>
                      <button className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-slate-100 text-slate-600 transition-colors"><Video className="w-4 h-4" /></button>
                      <button className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-slate-100 text-slate-600 transition-colors"><MoreVertical className="w-4 h-4" /></button>
                   </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-slate-50/50">
                   {messages.map((msg, idx) => {
                     const isMine = msg.senderCompanyId === company?.id;
                     return (
                       <div key={idx} className={clsx("flex items-end", isMine ? "justify-end" : "justify-start")}>
                          {!isMine && <div className="w-8 h-8 rounded-full bg-slate-200 mr-3 flex shrink-0 border border-slate-300"></div>}
                          <div className={clsx(
                             "px-4 py-2.5 max-w-[70%] shadow-sm",
                             isMine ? "bg-blue-600 text-white rounded-2xl rounded-br-sm" : "bg-white border border-slate-200 rounded-2xl rounded-bl-sm"
                          )}>
                             <p className={clsx("text-sm", !isMine && "text-slate-700")}>{msg.content}</p>
                             <div className={clsx("flex items-center mt-1 space-x-1", isMine ? "justify-end" : "justify-start")}>
                                <span className={clsx("text-[10px]", isMine ? "text-blue-200" : "text-slate-400 block")}>
                                  {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                                {isMine && <CheckCircle2 className="w-3 h-3 text-blue-300" />}
                             </div>
                          </div>
                       </div>
                     );
                   })}
                   <div ref={messagesEndRef} />
                </div>

                <div className="p-4 border-t border-slate-200 bg-white shrink-0">
                   <div className="flex items-center space-x-3 max-w-4xl mx-auto">
                      <input 
                        type="text" 
                        placeholder="Type your message..." 
                        className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100 focus:bg-white transition-colors text-sm" 
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        onKeyDown={(e) => {
                           if (e.key === 'Enter') handleSendMessage();
                        }}
                      />
                      <button 
                        onClick={handleSendMessage}
                        className="w-12 h-12 bg-blue-900 rounded-xl text-white flex items-center justify-center hover:bg-blue-800 transition-colors shadow-sm shrink-0"
                      >
                         <Send className="w-5 h-5 ml-1" />
                      </button>
                   </div>
                </div>
              </>
            ) : (
               <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
                 <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                   <Send className="w-8 h-8 text-slate-300" />
                 </div>
                 <p>Select a conversation to start messaging</p>
               </div>
            )}
         </div>
      </div>
    </motion.div>
  );
}
