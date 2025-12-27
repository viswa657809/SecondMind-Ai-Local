import React, { useState, useEffect } from 'react';
import {
  Search,
  PlusCircle,
  Send,
  Loader2,
  Database,
  Shield,
  BarChart4,
  Rocket,
  Menu,
  X,
  FileDown,
  History,
  Trash2,
  Copy,
  Printer
} from 'lucide-react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

interface WebResearchResult {
  title: string;
  link: string;
  snippet: string;
}

interface ResearchData {
  Task: string;
  "Generated Hypotheses": string[];
  "Web Research": WebResearchResult[];
  "Analysis": string[];
  "Reasoning": string[];
  "Evaluation": string[];
  "Summary": string[];
  "Conclusion": string[];
}

interface ChatItem {
  id: number;
  title: string;
  task: string;
}

const App = () => {
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [researchData, setResearchData] = useState<ResearchData | null>(null);
  const [chats, setChats] = useState<ChatItem[]>([]); // ✅ EMPTY - NO DEFAULT HISTORY
  const [activeChat, setActiveChat] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAnimation, setShowAnimation] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showPrintPreview, setShowPrintPreview] = useState(false);

  useEffect(() => {
    if (researchData) {
      setShowAnimation(true);
      const timer = setTimeout(() => setShowAnimation(false), 500);
      return () => clearTimeout(timer);
    }
  }, [researchData]);

  const handleSubmitResearch = async () => {
    if (message.trim()) {
      setIsLoading(true);
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/supervisor`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ task: message }),
        });

        if (!response.ok) throw new Error(`Error: ${response.statusText}`);
        const data = await response.json();
        setResearchData(data);

        const chatExists = chats.some(chat => chat.task === message);
        if (!chatExists) {
          const newChat: ChatItem = {
            id: Date.now(),
            title: message.slice(0, 30) + (message.length > 30 ? '...' : ''),
            task: message
          };
          setChats(prev => [newChat, ...prev]);
          setActiveChat(newChat.id);
        }
      } catch (error) {
        console.error("Failed to fetch research data:", error);
        alert("Failed to process research. Please try again.");
      } finally {
        setIsLoading(false);
      }
    }
  };

  const createNewChat = () => {
    const newChat: ChatItem = { id: Date.now(), title: `New Research`, task: '' };
    setChats(prev => [newChat, ...prev]);
    setActiveChat(newChat.id);
    setResearchData(null);
    setMessage('');
    setSidebarOpen(false);
  };

  const handleChatSelect = async (chatId: number) => {
    setActiveChat(chatId);
    const selectedChat = chats.find(chat => chat.id === chatId);
    if (selectedChat?.task) {
      setMessage(selectedChat.task);
      setIsLoading(true);
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/supervisor`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ task: selectedChat.task }),
        });
        if (!response.ok) throw new Error(`Error: ${response.statusText}`);
        const data = await response.json();
        setResearchData(data);
      } catch (error) {
        console.error("Failed to fetch research data:", error);
        alert("Failed to load saved research. Please try again.");
      } finally {
        setIsLoading(false);
        setSidebarOpen(false);
      }
    } else {
      setResearchData(null);
    }
  };

  const clearHistory = () => {
    if (window.confirm('Clear all research history?')) {
      setChats([]);
      setResearchData(null);
      setMessage('');
      setActiveChat(null);
    }
  };

  const copyToClipboard = () => {
    if (!researchData) return;
    const text = `
${researchData.Task}

Summary: ${researchData.Summary.join('\n')}
Hypotheses: ${researchData["Generated Hypotheses"].join('\n')}
Analysis: ${researchData.Analysis.join('\n')}
Conclusion: ${researchData.Conclusion.join('\n')}
    `.trim();
    navigator.clipboard.writeText(text).then(() => {
      alert('Copied to clipboard!');
    });
  };

  const handleDownloadPDF = () => {
    if (!researchData) return;

    const doc = new jsPDF('p', 'mm', 'a4');
    const marginLeft = 15;
    const marginRight = 15;
    let y = 20;

    // Header
    doc.setFillColor(59, 130, 246);
    doc.rect(0, 0, 210, 20, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('AI Research Report', 105, 13, { align: 'center' });

    // Title
    y = 30;
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    const titleLines = doc.splitTextToSize(researchData.Task, 170);
    doc.text(titleLines, marginLeft, y);
    y += titleLines.length * 7 + 10;

    // Timestamp
    doc.setFontSize(9);
    doc.setFont('helvetica', 'italic');
    doc.text(`Generated: ${new Date().toLocaleString()}`, marginLeft, y);
    y += 10;

    const addSection = (title: string, content: string[] | WebResearchResult[]) => {
      if (!content || content.length === 0) return y;

      // Section title
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setDrawColor(220, 220, 220);
      doc.setFillColor(248, 250, 252);
      doc.rect(marginLeft - 5, y - 5, 170, 8, 'F');
      doc.text(title, marginLeft, y + 2);
      y += 12;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      
      if (typeof content[0] === 'string') {
        (content as string[]).forEach(line => {
          if (!line.trim()) return;
          const splitText = doc.splitTextToSize(line.trim(), 170);
          doc.text(splitText, marginLeft, y);
          y += splitText.length * 5;
          if (y > 270) {
            doc.addPage();
            y = 20;
          }
        });
      } else {
        (content as WebResearchResult[]).forEach((item, idx) => {
          doc.text(`${idx + 1}. ${item.title}`, marginLeft, y);
          y += 6;
          const linkText = doc.splitTextToSize(item.link, 170);
          doc.text(linkText, marginLeft + 3, y);
          y += linkText.length * 5 + 2;
        });
      }
      y += 8;
      return y;
    };

    y = addSection('Summary', researchData.Summary);
    y = addSection('Generated Hypotheses', researchData["Generated Hypotheses"]);
    
    if (researchData["Web Research"]?.length) {
      y = addSection('Web Research', researchData["Web Research"]);
    }
    
    y = addSection('Analysis', researchData.Analysis);
    y = addSection('Reasoning', researchData.Reasoning);
    y = addSection('Evaluation', researchData.Evaluation);
    y = addSection('Conclusion', researchData.Conclusion);

    // Footer
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      doc.text(`Page ${i} of ${pageCount}`, 105, 290, { align: 'center' });
    }

    doc.save(`AI_Research_${researchData.Task.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 50)}_${Date.now()}.pdf`);
  };

  const renderResearchSection = (title: string, content: string[] | WebResearchResult[], icon: React.ReactNode) => {
    if (!Array.isArray(content) || content.length === 0) return null;

    const animationClass = showAnimation ? 'animate-fade-in' : '';
    const isWebResearch = typeof content[0] !== 'string';

    return (
      <div className={`mb-8 ${animationClass}`} style={{ transition: 'all 0.3s ease-in-out' }}>
        {/* Section Header */}
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-200">
          <h3 className="text-lg font-semibold flex items-center">
            {icon}
            <span className="ml-2">{title}</span>
          </h3>
          {title === 'Summary' && (
            <div className="flex gap-2">
              <button
                onClick={copyToClipboard}
                className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-all"
                title="Copy to clipboard"
              >
                <Copy size={16} />
              </button>
              <button
                onClick={() => setShowPrintPreview(true)}
                className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-all"
                title="Print preview"
              >
                <Printer size={16} />
              </button>
            </div>
          )}
        </div>

        {/* Continuous Content - NO SCROLL */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
          {isWebResearch ? (
            (content as WebResearchResult[]).map((item, index) => (
              <div key={index} className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border-l-4 border-blue-400">
                <h4 className="font-semibold text-gray-900 mb-2 text-sm">{item.title}</h4>
                <a
                  href={item.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 font-medium text-xs block mb-3 hover:underline break-all"
                >
                  🔗 {item.link}
                </a>
                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap break-words">{item.snippet}</p>
              </div>
            ))
          ) : (
            (content as string[]).map((item, index) => (
              <div key={index} className="mb-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors border-l-4 border-gray-200">
                <p className="whitespace-pre-wrap text-gray-800 leading-relaxed text-sm break-words">{item}</p>
              </div>
            ))
          )}
        </div>
      </div>
    );
  };

  const filteredChats = chats.filter(chat =>
    chat.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    chat.task.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const fadeInAnimation = `@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } } .animate-fade-in { animation: fadeIn 0.5s ease-out forwards; }`;
  const slideInAnimation = `@keyframes slideIn { from { transform: translateX(-20px); opacity: 0; } to { transform: translateX(0); opacity: 1; } } .animate-slide-in { animation: slideIn 0.3s ease-out forwards; }`;

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <style>{fadeInAnimation}{slideInAnimation}</style>

      {/* Collapsible Sidebar - EMPTY BY DEFAULT */}
      {sidebarOpen && (
        <>
          <div className="fixed inset-0 bg-black/30 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
          <div className="w-72 bg-white/80 backdrop-blur-xl shadow-2xl border-r border-gray-200 flex flex-col z-50 fixed h-full lg:static">
            <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-slate-50 to-gray-50">
              <div className="flex items-center justify-between mb-4">
                <button
                  onClick={createNewChat}
                  className="flex items-center p-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 shadow-lg hover:shadow-xl transition-all text-sm font-medium"
                >
                  <PlusCircle className="mr-2" size={18} />
                  New Research
                </button>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="p-2 rounded-lg hover:bg-red-100 hover:text-red-600 transition-all"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Search Bar in Sidebar */}
              <div className="relative mb-4">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  placeholder="Search history..."
                  className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-100 transition-all shadow-sm bg-white/50 backdrop-blur-sm text-sm"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-4 pb-4">
              {chats.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p className="text-sm">No research history yet</p>
                  <p className="text-xs mt-1">Start your first research above</p>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-4 py-2">
                    <span className="text-xs font-bold text-gray-600 uppercase tracking-wider">Research History ({filteredChats.length})</span>
                    <button
                      onClick={clearHistory}
                      className="flex items-center text-xs text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50 transition-all"
                    >
                      <Trash2 size={14} className="mr-1" />
                      Clear
                    </button>
                  </div>
                  {filteredChats.map((chat, index) => (
                    <div
                      key={chat.id}
                      className={`p-3 mb-2 rounded-xl cursor-pointer transition-all hover:shadow-md border-2 text-sm ${
                        activeChat === chat.id
                          ? 'border-blue-500 bg-blue-50 shadow-lg ring-2 ring-blue-200'
                          : 'border-transparent hover:border-gray-200 hover:bg-gray-50'
                      } animate-slide-in`}
                      onClick={() => handleChatSelect(chat.id)}
                      style={{ animationDelay: `${index * 0.05}s` }}
                    >
                      <div className="font-medium text-gray-900 truncate">{chat.title}</div>
                      {chat.task && <div className="text-xs text-gray-500 mt-1 truncate">{chat.task.slice(0, 60)}...</div>}
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>
        </>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Enhanced Header - MEDIUM SIZE */}
        <header className="bg-white/80 backdrop-blur-xl shadow-lg border-b border-gray-200 sticky top-0 z-30">
          <div className="px-6 py-4 flex items-center justify-between">
            <div className="flex items-center">
              {!sidebarOpen && (
                <button
                  className="p-2 mr-4 rounded-xl border border-gray-200 hover:bg-gray-100 hover:shadow-md transition-all"
                  onClick={() => setSidebarOpen(true)}
                >
                  <Menu size={20} />
                </button>
              )}
              <div className="flex items-center">
                <Rocket className="text-blue-600 mr-3" size={24} />
                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 text-transparent bg-clip-text tracking-tight">
                  AI Research Assistant
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {researchData && (
                <button
                  onClick={handleDownloadPDF}
                  className="flex items-center px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-medium rounded-xl hover:from-emerald-600 hover:to-emerald-700 shadow-lg hover:shadow-xl transition-all text-sm"
                >
                  <FileDown className="mr-2" size={18} />
                  Download PDF
                </button>
              )}
            </div>
          </div>
        </header>

        {/* CONTINUOUS SCROLLING CONTENT */}
        <div className="flex-1 overflow-y-auto p-6 bg-gradient-to-b from-transparent to-slate-50">
          <div className="max-w-4xl mx-auto">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center h-80">
                <div className="text-center p-10 bg-white/70 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-200 max-w-lg mx-auto">
                  <Loader2 className="animate-spin h-14 w-14 mx-auto mb-6 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full p-4 text-white" />
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">Analyzing Research...</h3>
                  <p className="text-gray-600 mb-6">Processing web sources and generating insights</p>
                  <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full animate-pulse" style={{ width: '75%' }} />
                  </div>
                </div>
              </div>
            ) : researchData ? (
              <div className="space-y-8 animate-fade-in">
                <div className="text-center pb-6">
                  <h2 className="text-3xl font-black mb-3 bg-gradient-to-r from-gray-900 to-gray-700 text-transparent bg-clip-text">
                    {researchData.Task}
                  </h2>
                  <div className="w-20 h-1 bg-gradient-to-r from-blue-500 to-purple-500 mx-auto rounded-full" />
                </div>

                {renderResearchSection("Summary", researchData["Summary"] || [], <Database size={20} className="text-indigo-600" />)}
                {renderResearchSection("Generated Hypotheses", researchData["Generated Hypotheses"] || [], <Database size={20} className="text-blue-600" />)}
                {renderResearchSection("Web Research", researchData["Web Research"] || [], <Search size={20} className="text-emerald-600" />)}
                {renderResearchSection("Analysis", researchData["Analysis"] || [], <BarChart4 size={20} className="text-orange-600" />)}
                {renderResearchSection("Reasoning", researchData["Reasoning"] || [], <Shield size={20} className="text-purple-600" />)}
                {renderResearchSection("Evaluation", researchData["Evaluation"] || [], <BarChart4 size={20} className="text-red-600" />)}
                {renderResearchSection("Conclusion", researchData["Conclusion"] || [], <Rocket size={20} className="text-indigo-600" />)}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-80 text-center bg-white/60 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-200 p-10 max-w-xl mx-auto animate-fade-in">
                <Rocket className="h-20 w-20 mx-auto mb-6 text-blue-500 animate-bounce" />
                <h2 className="text-2xl font-bold mb-3 bg-gradient-to-r from-blue-600 to-purple-600 text-transparent bg-clip-text">
                  Welcome to AI Research Assistant
                </h2>
                <p className="text-lg text-gray-600 mb-6 max-w-md mx-auto leading-relaxed">
                  Enter any research topic or question below and get comprehensive analysis with web sources
                </p>
                <div className="w-24 h-1 bg-gradient-to-r from-blue-500 to-purple-500 mx-auto rounded-full" />
              </div>
            )}
          </div>
        </div>

        {/* Input Area - MEDIUM SIZE */}
        <div className="p-5 bg-white/80 backdrop-blur-xl border-t border-gray-200 shadow-2xl">
          <div className="max-w-4xl mx-auto relative">
            <input
              type="text"
              placeholder="Enter your research topic or question..."
              className="w-full p-4 pl-14 pr-14 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-100 shadow-lg hover:shadow-xl transition-all text-base bg-white/50 backdrop-blur-sm"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSubmitResearch()}
            />
            <button
              className={`absolute right-4 top-1/2 transform -translate-y-1/2 p-3 rounded-xl transition-all shadow-lg ${
                isLoading
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 hover:shadow-xl hover:scale-105'
              }`}
              onClick={handleSubmitResearch}
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="animate-spin" size={18} />
              ) : (
                <Send size={18} />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Print Preview Modal */}
      {showPrintPreview && researchData && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white max-w-4xl w-full max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-xl font-bold">Print Preview</h3>
              <div className="flex gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all"
                >
                  Print
                </button>
                <button
                  onClick={() => setShowPrintPreview(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-all"
                >
                  Close
                </button>
              </div>
            </div>
            <div className="p-8">
              <h1 className="text-3xl font-bold mb-8">{researchData.Task}</h1>
              <div dangerouslySetInnerHTML={{ __html: document.querySelector('.animate-fade-in')?.innerHTML || '' }} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
