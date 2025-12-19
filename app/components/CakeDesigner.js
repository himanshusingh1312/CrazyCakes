"use client";

import React, { useRef, useEffect, useState } from "react";
import { toast } from "react-toastify";

const CakeDesigner = ({ productImage, onSave, onClose }) => {
  const canvasRef = useRef(null);
  const [canvasSize, setCanvasSize] = useState(600);
  const [tool, setTool] = useState("text"); // text, shape, decoration
  const [textInput, setTextInput] = useState("");
  const [fontSize, setFontSize] = useState(40);
  const [textColor, setTextColor] = useState("#5b3a29");
  const [fontFamily, setFontFamily] = useState("Arial");
  const [textStyle, setTextStyle] = useState({ bold: false, italic: false, underline: false });
  const [textAlign, setTextAlign] = useState("left");
  const [textShadow, setTextShadow] = useState(false);
  const [textOutline, setTextOutline] = useState(false);
  const [outlineColor, setOutlineColor] = useState("#FFFFFF");
  const [elements, setElements] = useState([]);
  const [selectedElement, setSelectedElement] = useState(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });

  const fonts = [
    "Arial", "Times New Roman", "Courier New", "Georgia", "Verdana", 
    "Comic Sans MS", "Impact", "Trebuchet MS", "Lucida Console", "Palatino"
  ];
  const colors = [
    "#5b3a29", "#8a6a52", "#000000", "#FFFFFF", "#FFD700", "#FF69B4", 
    "#FF0000", "#00FF00", "#0000FF", "#FFA500", "#800080", "#FFC0CB",
    "#FF1493", "#00CED1", "#FF6347", "#32CD32", "#9370DB",
    "#FF4500", "#1E90FF", "#00FA9A", "#FFB6C1", "#FF1493", "#8B4513"
  ];
  const shapes = ["heart", "star", "circle", "square", "triangle", "diamond", "hexagon"];
  const decorations = [
    "🎂", "🎉", "🎈", "🎁", "⭐", "💝", "🌸", "✨", "🎊", "🎀", 
    "💐", "🌺", "🌻", "🌷", "🌹", "🍰", "🧁", "🍩", "🍪", "🎪"
  ];

  // Helper functions for drawing
  const drawHeart = (ctx, size) => {
    ctx.beginPath();
    const topCurveHeight = size * 0.3;
    ctx.moveTo(0, topCurveHeight);
    ctx.bezierCurveTo(0, 0, -size / 2, 0, -size / 2, topCurveHeight);
    ctx.bezierCurveTo(-size / 2, size / 2, 0, size / 2, 0, size);
    ctx.bezierCurveTo(0, size / 2, size / 2, size / 2, size / 2, topCurveHeight);
    ctx.bezierCurveTo(size / 2, 0, 0, 0, 0, topCurveHeight);
    ctx.fill();
  };

  const drawStar = (ctx, size) => {
    ctx.beginPath();
    const spikes = 5;
    const outerRadius = size / 2;
    const innerRadius = outerRadius / 2;
    let rot = (Math.PI / 2) * 3;
    let x = 0;
    let y = 0;

    for (let i = 0; i < spikes * 2; i++) {
      const radius = i % 2 === 0 ? outerRadius : innerRadius;
      x = Math.cos(rot) * radius;
      y = Math.sin(rot) * radius;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
      rot += (Math.PI / spikes);
    }
    ctx.closePath();
    ctx.fill();
  };

  const drawTriangle = (ctx, size) => {
    ctx.beginPath();
    ctx.moveTo(0, -size / 2);
    ctx.lineTo(-size / 2, size / 2);
    ctx.lineTo(size / 2, size / 2);
    ctx.closePath();
    ctx.fill();
  };

  const drawDiamond = (ctx, size) => {
    ctx.beginPath();
    ctx.moveTo(0, -size / 2);
    ctx.lineTo(size / 2, 0);
    ctx.lineTo(0, size / 2);
    ctx.lineTo(-size / 2, 0);
    ctx.closePath();
    ctx.fill();
  };

  const drawHexagon = (ctx, size) => {
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 3) * i;
      const x = Math.cos(angle) * (size / 2);
      const y = Math.sin(angle) * (size / 2);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();
  };

  const drawShape = (ctx, element) => {
    ctx.save();
    ctx.translate(element.x, element.y);
    ctx.fillStyle = element.color;
    
    switch (element.shape) {
      case "heart":
        drawHeart(ctx, element.size);
        break;
      case "star":
        drawStar(ctx, element.size);
        break;
      case "circle":
        ctx.beginPath();
        ctx.arc(0, 0, element.size / 2, 0, Math.PI * 2);
        ctx.fill();
        break;
      case "square":
        ctx.fillRect(-element.size / 2, -element.size / 2, element.size, element.size);
        break;
      case "triangle":
        drawTriangle(ctx, element.size);
        break;
      case "diamond":
        drawDiamond(ctx, element.size);
        break;
      case "hexagon":
        drawHexagon(ctx, element.size);
        break;
    }
    ctx.restore();
  };

  const redrawElements = (ctx) => {
    elements.forEach((element) => {
      if (element.type === "text") {
        let fontStyle = "";
        if (element.bold) fontStyle += "bold ";
        if (element.italic) fontStyle += "italic ";
        ctx.font = `${fontStyle}${element.fontSize}px ${element.fontFamily}`;
        ctx.textAlign = element.textAlign || "left";
        ctx.textBaseline = "top";
        
        // Draw outline if enabled
        if (element.outline) {
          ctx.strokeStyle = element.outlineColor || "#FFFFFF";
          ctx.lineWidth = 3;
          ctx.strokeText(element.text, element.x, element.y);
        }
        
        // Draw shadow if enabled
        if (element.shadow) {
          ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
          ctx.shadowBlur = 4;
          ctx.shadowOffsetX = 2;
          ctx.shadowOffsetY = 2;
        }
        
        ctx.fillStyle = element.color;
        ctx.fillText(element.text, element.x, element.y);
        
        // Draw underline if enabled
        if (element.underline) {
          const textWidth = ctx.measureText(element.text).width;
          ctx.strokeStyle = element.color;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(element.x, element.y + element.fontSize + 2);
          ctx.lineTo(element.x + textWidth, element.y + element.fontSize + 2);
          ctx.stroke();
        }
        
        // Reset shadow
        ctx.shadowColor = "transparent";
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
      } else if (element.type === "shape") {
        drawShape(ctx, element);
      } else if (element.type === "decoration") {
        ctx.font = `${element.fontSize}px Arial`;
        ctx.fillText(element.emoji, element.x, element.y);
      }
    });
  };

  // Responsive canvas sizing
  useEffect(() => {
    const handleResize = () => {
      if (typeof window === "undefined") return;
      const width = window.innerWidth;
      const nextSize = Math.min(600, Math.max(320, width - 48));
      setCanvasSize(nextSize);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    canvas.width = canvasSize;
    canvas.height = canvasSize;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw product image as background
    if (productImage) {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        redrawElements(ctx);
      };
      img.onerror = () => {
        // Default cake background if image fails to load
        ctx.fillStyle = "#fffaf3";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        redrawElements(ctx);
      };
      img.src = productImage;
    } else {
      // Default cake background
      ctx.fillStyle = "#fffaf3";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      redrawElements(ctx);
    }
  }, [productImage, canvasSize]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    
    // Redraw background
    if (productImage) {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        redrawElements(ctx);
      };
      img.src = productImage;
    } else {
      ctx.fillStyle = "#fffaf3";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      redrawElements(ctx);
    }
  }, [elements, productImage, canvasSize]);


  const handleCanvasClick = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (tool === "text" && textInput.trim()) {
      const newElement = {
        id: Date.now(),
        type: "text",
        text: textInput,
        x,
        y,
        fontSize,
        fontFamily,
        color: textColor,
        bold: textStyle.bold,
        italic: textStyle.italic,
        underline: textStyle.underline,
        textAlign: textAlign,
        shadow: textShadow,
        outline: textOutline,
        outlineColor: outlineColor,
      };
      const newElements = [...elements, newElement];
      setElements(newElements);
      setTextInput("");
    } else if (tool === "shape") {
      const newElement = {
        id: Date.now(),
        type: "shape",
        shape: "circle",
        x,
        y,
        size: fontSize * 2,
        color: textColor,
      };
      const newElements = [...elements, newElement];
      setElements(newElements);
    } else if (tool === "decoration") {
      const newElement = {
        id: Date.now(),
        type: "decoration",
        emoji: "🎂",
        x,
        y,
        fontSize: fontSize * 1.5,
      };
      const newElements = [...elements, newElement];
      setElements(newElements);
    }
  };

  const handleCanvasMouseDown = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Check if clicking on an element
    const clickedElement = elements.find((el) => {
      if (el.type === "text") {
        const ctx = canvas.getContext("2d");
        ctx.font = `${el.fontSize}px ${el.fontFamily}`;
        const width = ctx.measureText(el.text).width;
        return x >= el.x && x <= el.x + width && y >= el.y && y <= el.y + el.fontSize;
      }
      return false;
    });

    if (clickedElement) {
      setSelectedElement(clickedElement);
      setIsDrawing(true);
      setStartPos({ x: x - clickedElement.x, y: y - clickedElement.y });
    }
  };

  const handleCanvasMouseMove = (e) => {
    if (isDrawing && selectedElement) {
      const canvas = canvasRef.current;
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const updatedElements = elements.map((el) =>
        el.id === selectedElement.id
          ? { ...el, x: x - startPos.x, y: y - startPos.y }
          : el
      );
      setElements(updatedElements);
      setSelectedElement(updatedElements.find((el) => el.id === selectedElement.id));
    }
  };

  const handleCanvasMouseUp = () => {
    setIsDrawing(false);
    setSelectedElement(null);
  };

  const handleDelete = () => {
    if (selectedElement) {
      const newElements = elements.filter((el) => el.id !== selectedElement.id);
      setElements(newElements);
      setSelectedElement(null);
      toast.success("Element deleted");
    }
  };

  const handleSave = () => {
    const canvas = canvasRef.current;
    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], "customized-cake.png", { type: "image/png" });
        onSave(file);
        toast.success("Design saved!");
        onClose();
      }
    }, "image/png");
  };

  const handleClear = () => {
    setElements([]);
    setSelectedElement(null);
    toast.success("All elements cleared");
  };

  const handleDuplicate = () => {
    if (selectedElement) {
      const newElement = {
        ...selectedElement,
        id: Date.now(),
        x: selectedElement.x + 20,
        y: selectedElement.y + 20,
      };
      const newElements = [...elements, newElement];
      setElements(newElements);
      setSelectedElement(newElement);
    }
  };

  const handleBringToFront = () => {
    if (selectedElement) {
      const filtered = elements.filter((el) => el.id !== selectedElement.id);
      const newElements = [...filtered, selectedElement];
      setElements(newElements);
    }
  };

  const handleSendToBack = () => {
    if (selectedElement) {
      const filtered = elements.filter((el) => el.id !== selectedElement.id);
      const newElements = [selectedElement, ...filtered];
      setElements(newElements);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-black/70 via-black/60 to-black/70 backdrop-blur-md p-3 sm:p-4 text-[13px] sm:text-sm">
      <div className="bg-gradient-to-br from-white via-[#fffaf3] to-white rounded-2xl sm:rounded-3xl shadow-2xl max-w-7xl w-full max-h-[95vh] overflow-hidden flex flex-col border-2 border-[#e5d4c4]">
        {/* Header */}
        <div className="p-4 sm:p-6 border-b-2 border-[#e5d4c4] bg-gradient-to-r from-[#5b3a29] to-[#8a6a52]">
          <div className="flex justify-between items-center gap-2">
            <div className="flex items-center gap-3">
              <span className="sm:text-3xl text-xl">🎂</span>
              <div>
                <h2 className=" text-lg sm:text-xl md:text-2xl font-bold text-white leading-tight mb-1">Cake Designer Studio</h2>
                <p className="text-xs sm:text-sm text-white/90">Create your perfect cake design</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={onClose}
                className="text-white hover:bg-white/20 rounded-full p-2 text-xl sm:text-2xl transition w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center"
                title="Close"
              >
                ×
              </button>
            </div>
          </div>
        </div>
        
        <div className="flex-1 overflow-auto p-4 sm:p-6">

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-3 sm:gap-4">
            {/* Toolbox */}
            <div className="lg:col-span-1 space-y-4 overflow-y-auto max-h-[calc(95vh-200px)] pr-1 sm:pr-2">
              <div className="bg-gradient-to-br from-[#fffaf3] to-white p-4 sm:p-5 rounded-xl border-2 border-[#e5d4c4] shadow-lg">
                <h3 className="font-bold text-[#5b3a29] mb-4 text-base sm:text-lg flex items-center gap-2">
                  <span>🛠️</span> Design Tools
                </h3>
                <div className="grid sm:grid-cols-3 grid-cols-2 gap-2 mb-4 sm:mb-5">
                  <button
                    onClick={() => setTool("text")}
                    className={`px-2.5 sm:px-4 py-2 sm:py-3 rounded-xl text-xs sm:text-sm font-bold transition-all transform hover:scale-105 ${
                      tool === "text"
                        ? "bg-gradient-to-r from-[#5b3a29] to-[#8a6a52] text-white shadow-lg"
                        : "bg-white text-[#5b3a29] border-2 border-[#e5d4c4] hover:border-[#5b3a29]"
                    }`}
                  >
                    ✍️ Text
                  </button>
                  <button
                    onClick={() => setTool("shape")}
                    className={`px-2.5 sm:px-4 py-2 sm:py-3 rounded-xl text-xs sm:text-sm font-bold transition-all transform hover:scale-105 ${
                      tool === "shape"
                        ? "bg-gradient-to-r from-[#5b3a29] to-[#8a6a52] text-white shadow-lg"
                        : "bg-white text-[#5b3a29] border-2 border-[#e5d4c4] hover:border-[#5b3a29]"
                    }`}
                  >
                    ⬟ Shape
                  </button>
                  <button
                    onClick={() => setTool("decoration")}
                    className={`px-2.5 sm:px-4 py-2 sm:py-3 rounded-xl text-xs sm:text-sm font-bold transition-all transform hover:scale-105 ${
                      tool === "decoration"
                        ? "bg-gradient-to-r from-[#5b3a29] to-[#8a6a52] text-white shadow-lg"
                        : "bg-white text-[#5b3a29] border-2 border-[#e5d4c4] hover:border-[#5b3a29]"
                    }`}
                  >
                    ✨ Decor
                  </button>
                </div>

                {tool === "text" && (
                  <div className="space-y-3">
                    {/* AI Occasion Suggestions */}
                    <div>
                      <label className="block text-xs font-semibold text-[#5b3a29] mb-2">🤖 Quick Suggestions</label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => setTextInput("Happy Birthday")}
                          className="px-3 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg text-xs font-semibold hover:from-purple-600 hover:to-pink-600 transition transform hover:scale-105"
                        >
                          🎂 Birthday
                        </button>
                        <button
                          onClick={() => setTextInput("Happy Anniversary")}
                          className="px-3 py-2 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-lg text-xs font-semibold hover:from-red-600 hover:to-pink-600 transition transform hover:scale-105"
                        >
                          💑 Anniversary
                        </button>
                        <button
                          onClick={() => setTextInput("Congratulations")}
                          className="px-3 py-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-lg text-xs font-semibold hover:from-blue-600 hover:to-indigo-600 transition transform hover:scale-105"
                        >
                          🎓 Graduation
                        </button>
                        <button
                          onClick={() => setTextInput("Just Married")}
                          className="px-3 py-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-white rounded-lg text-xs font-semibold hover:from-yellow-500 hover:to-orange-600 transition transform hover:scale-105"
                        >
                          💒 Wedding
                        </button>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-xs font-semibold text-[#5b3a29] mb-1">Add Name/Text</label>
                      <input
                        type="text"
                        value={textInput}
                        onChange={(e) => setTextInput(e.target.value)}
                        placeholder="Enter name or message"
                        className="w-full px-3 py-2 border-2 border-[#e5d4c4] rounded-lg text-sm focus:border-[#5b3a29] focus:outline-none transition"
                      />
                      <p className="text-xs text-[#8a6a52] mt-1">
                        💡 Click on canvas to add text
                      </p>
                    </div>
                    
                    <div>
                      <label className="block text-xs font-semibold text-[#5b3a29] mb-1">Font Size: {fontSize}px</label>
                      <input
                        type="range"
                        min="20"
                        max="100"
                        value={fontSize}
                        onChange={(e) => setFontSize(Number(e.target.value))}
                        className="w-full accent-[#5b3a29]"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-xs font-semibold text-[#5b3a29] mb-1">Font Family</label>
                      <select
                        value={fontFamily}
                        onChange={(e) => setFontFamily(e.target.value)}
                        className="w-full px-3 py-2 border-2 border-[#e5d4c4] rounded-lg text-sm focus:border-[#5b3a29] focus:outline-none transition"
                      >
                        {fonts.map((font) => (
                          <option key={font} value={font}>
                            {font}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-xs font-semibold text-[#5b3a29] mb-2">Text Style</label>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setTextStyle({...textStyle, bold: !textStyle.bold})}
                          className={`flex-1 px-3 py-2 rounded-lg text-sm font-semibold transition ${
                            textStyle.bold
                              ? "bg-[#5b3a29] text-white"
                              : "bg-white text-[#5b3a29] border-2 border-[#e5d4c4]"
                          }`}
                        >
                          <strong>B</strong>
                        </button>
                        <button
                          onClick={() => setTextStyle({...textStyle, italic: !textStyle.italic})}
                          className={`flex-1 px-3 py-2 rounded-lg text-sm font-semibold transition ${
                            textStyle.italic
                              ? "bg-[#5b3a29] text-white"
                              : "bg-white text-[#5b3a29] border-2 border-[#e5d4c4]"
                          }`}
                        >
                          <em>I</em>
                        </button>
                        <button
                          onClick={() => setTextStyle({...textStyle, underline: !textStyle.underline})}
                          className={`flex-1 px-3 py-2 rounded-lg text-sm font-semibold transition ${
                            textStyle.underline
                              ? "bg-[#5b3a29] text-white"
                              : "bg-white text-[#5b3a29] border-2 border-[#e5d4c4]"
                          }`}
                        >
                          <u>U</u>
                        </button>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-xs font-semibold text-[#5b3a29] mb-2">Text Alignment</label>
                      <div className="grid sm:grid-cols-3 grid-cols-2 gap-2">
                        {["left", "center", "right"].map((align) => (
                          <button
                            key={align}
                            onClick={() => setTextAlign(align)}
                            className={`flex-1 px-3 py-2 rounded-lg text-xs font-semibold transition capitalize ${
                              textAlign === align
                                ? "bg-[#5b3a29] text-white"
                                : "bg-white text-[#5b3a29] border-2 border-[#e5d4c4]"
                            }`}
                          >
                            {align}
                          </button>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-xs font-semibold text-[#5b3a29] mb-2">Text Effects</label>
                      <div className="space-y-2">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={textShadow}
                            onChange={(e) => setTextShadow(e.target.checked)}
                            className="w-4 h-4 accent-[#5b3a29]"
                          />
                          <span className="text-xs text-[#8a6a52]">Shadow Effect</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={textOutline}
                            onChange={(e) => setTextOutline(e.target.checked)}
                            className="w-4 h-4 accent-[#5b3a29]"
                          />
                          <span className="text-xs text-[#8a6a52]">Text Outline</span>
                        </label>
                        {textOutline && (
                          <div>
                            <label className="block text-xs text-[#8a6a52] mb-1">Outline Color</label>
                            <div className="grid grid-cols-6 gap-1">
                              {colors.slice(0, 6).map((color) => (
                                <button
                                  key={color}
                                  onClick={() => setOutlineColor(color)}
                                  className={`w-6 h-6 rounded border-2 ${
                                    outlineColor === color ? "border-[#5b3a29] scale-110" : "border-gray-300"
                                  }`}
                                  style={{ backgroundColor: color }}
                                />
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-xs font-semibold text-[#5b3a29] mb-2">Text Color</label>
                      <div className="grid sm:grid-cols-6 grid-cols-4 gap-2">
                        {colors.map((color, index) => (
                          <button
                            key={`color-${index}-${color}`}
                            onClick={() => setTextColor(color)}
                            className={`w-8 h-8 rounded-lg border-2 transition transform ${
                              textColor === color ? "border-[#5b3a29] scale-110 shadow-md" : "border-gray-300 hover:scale-105"
                            }`}
                            style={{ backgroundColor: color }}
                            title={color}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {tool === "shape" && (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs text-[#8a6a52] mb-2">Shapes</label>
                      <div className="grid grid-cols-2 gap-2">
                        {shapes.map((shape) => (
                          <button
                            key={shape}
                            onClick={() => {
                              const canvas = canvasRef.current;
                              const rect = canvas.getBoundingClientRect();
                              const newElement = {
                                id: Date.now(),
                                type: "shape",
                                shape,
                                x: rect.width / 2,
                                y: rect.height / 2,
                                size: fontSize * 2,
                                color: textColor,
                              };
                              const newElements = [...elements, newElement];
      setElements(newElements);
                            }}
                            className="px-3 py-2 bg-white border border-[#e5d4c4] rounded text-sm capitalize hover:bg-[#fff4ea]"
                          >
                            {shape}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs text-[#8a6a52] mb-1">Size: {fontSize * 2}px</label>
                      <input
                        type="range"
                        min="20"
                        max="160"
                        value={fontSize * 2}
                        onChange={(e) => setFontSize(Number(e.target.value) / 2)}
                        className="w-full"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-[#8a6a52] mb-1">Color</label>
                      <div className="grid grid-cols-4 gap-2">
                        {colors.map((color, index) => (
                          <button
                            key={`shape-color-${index}-${color}`}
                            onClick={() => setTextColor(color)}
                            className={`w-8 h-8 rounded border-2 ${
                              textColor === color ? "border-[#5b3a29]" : "border-gray-300"
                            }`}
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {tool === "decoration" && (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs text-[#8a6a52] mb-2">Decorations</label>
                      <div className="grid grid-cols-4 gap-2">
                        {decorations.map((emoji) => (
                          <button
                            key={emoji}
                            onClick={() => {
                              const canvas = canvasRef.current;
                              const rect = canvas.getBoundingClientRect();
                              const newElement = {
                                id: Date.now(),
                                type: "decoration",
                                emoji,
                                x: rect.width / 2,
                                y: rect.height / 2,
                                fontSize: fontSize * 1.5,
                              };
                              const newElements = [...elements, newElement];
      setElements(newElements);
                            }}
                            className="text-2xl p-2 bg-white border border-[#e5d4c4] rounded hover:bg-[#fff4ea]"
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs text-[#8a6a52] mb-1">Size: {fontSize * 1.5}px</label>
                      <input
                        type="range"
                        min="20"
                        max="120"
                        value={fontSize * 1.5}
                        onChange={(e) => setFontSize(Number(e.target.value) / 1.5)}
                        className="w-full"
                      />
                    </div>
                  </div>
                )}

                {/* Element Actions */}
                {selectedElement && (
                  <div className="mt-5 pt-5 border-t-2 border-[#e5d4c4] space-y-2">
                    <h4 className="font-bold text-[#5b3a29] text-sm mb-3">Element Actions</h4>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={handleDuplicate}
                        className="px-3 py-2 bg-blue-500 text-white rounded-lg text-xs font-semibold hover:bg-blue-600 transition transform hover:scale-105"
                      >
                        📋 Duplicate
                      </button>
                      <button
                        onClick={handleDelete}
                        className="px-3 py-2 bg-red-500 text-white rounded-lg text-xs font-semibold hover:bg-red-600 transition transform hover:scale-105"
                      >
                        🗑️ Delete
                      </button>
                      <button
                        onClick={handleBringToFront}
                        className="px-3 py-2 bg-purple-500 text-white rounded-lg text-xs font-semibold hover:bg-purple-600 transition transform hover:scale-105"
                      >
                        ⬆️ Front
                      </button>
                      <button
                        onClick={handleSendToBack}
                        className="px-3 py-2 bg-indigo-500 text-white rounded-lg text-xs font-semibold hover:bg-indigo-600 transition transform hover:scale-105"
                      >
                        ⬇️ Back
                      </button>
                    </div>
                  </div>
                )}

                <div className="mt-5 pt-5 border-t-2 border-[#e5d4c4]">
                  <button
                    onClick={handleClear}
                    className="w-full px-4 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl text-sm font-bold hover:from-red-600 hover:to-red-700 transition transform hover:scale-105 shadow-lg"
                  >
                    🗑️ Clear All Design
                  </button>
                </div>
              </div>
            </div>

            {/* Canvas */}
            <div className="lg:col-span-3 flex flex-col">
              <div className="bg-gradient-to-br from-[#f1e4d8] to-[#fffaf3] p-6 rounded-xl border-2 border-[#e5d4c4] shadow-inner">
                <div className="bg-white rounded-lg p-2 shadow-lg inline-block mx-auto">
                  <canvas
                    ref={canvasRef}
                    onClick={handleCanvasClick}
                    onMouseDown={handleCanvasMouseDown}
                    onMouseMove={handleCanvasMouseMove}
                    onMouseUp={handleCanvasMouseUp}
                    className="w-full border-2 border-[#5b3a29] rounded-lg cursor-crosshair bg-white shadow-md"
                    style={{ maxWidth: "600px", maxHeight: "600px" }}
                  />
                </div>
                <p className="text-xs text-[#8a6a52] mt-4 text-center font-medium">
                  💡 <strong>Tip:</strong> Click to add • Drag to move • Select to edit
                </p>
              </div>

              <div className="flex gap-4 mt-6">
                <button
                  onClick={handleSave}
                  className="flex-1 sm:px-8 sm:py-2 py-1 px-6 bg-gradient-to-r from-[#5b3a29] to-[#8a6a52] text-white rounded-xl sm:font-bold font-semibold sm:text-lg text-md hover:from-[#3e261a] hover:to-[#5b3a29] transition transform hover:scale-105 shadow-lg flex items-center justify-center gap-2"
                >
                  Save Design
                </button>
                <button
                  onClick={onClose}
                  className="sm:px-8 sm:py-2 py-1 px-6 border-2 border-[#5b3a29] text-[#5b3a29] rounded-xl sm:font-bold font-semibold sm:text-lg text-md hover:bg-[#fff4ea] transition transform hover:scale-105"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CakeDesigner;

