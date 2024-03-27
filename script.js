class Stage {
  constructor(ctx, id, x, y, radius, label) {
    this.ctx = ctx;
    this.id = id;
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.label = label;
    this.nextStages = [];
    this.isSelected = false;
  }

  draw() {
    this.ctx.beginPath();
    this.ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    if (this.isSelected) {
      this.ctx.fillStyle = "#FFA500"; // Highlight selected stage
    } else {
      this.ctx.fillStyle = "#009688";
    }
    this.ctx.fill();
    this.ctx.strokeStyle = "#004D40";
    this.ctx.lineWidth = 2;
    this.ctx.stroke();
    this.ctx.closePath();

    // Draw stage label
    this.ctx.fillStyle = "#000";
    this.ctx.font = "14px Arial";
    this.ctx.fillText(
      this.label,
      this.x - this.radius / 2,
      this.y - this.radius - 5
    );

    // Draw possible stages
    this.nextStages.forEach((nextStage) => {
      this.drawConnector(this, nextStage);
    });
  }

  drawConnector(startStage, endStage) {
    const dx = endStage.x - startStage.x;
    const dy = endStage.y - startStage.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const controlX = (startStage.x + endStage.x) / 2;
    const controlY =
      startStage.x > endStage.x
        ? (startStage.y + endStage.y) / 2 + distance / 4
        : (startStage.y + endStage.y) / 2 - distance / 4;

    this.ctx.beginPath();
    this.ctx.moveTo(startStage.x, startStage.y);
    this.ctx.quadraticCurveTo(controlX, controlY, endStage.x, endStage.y);
    this.ctx.strokeStyle = "#607D8B";
    this.ctx.lineWidth = 2;
    this.ctx.stroke();
    this.ctx.closePath();

    // Arrowhead
    const angle = Math.atan2(endStage.y - controlY, endStage.x - controlX);
    this.ctx.beginPath();
    this.ctx.moveTo(endStage.x, endStage.y);
    this.ctx.lineTo(
      endStage.x - 10 * Math.cos(angle - Math.PI / 6),
      endStage.y - 10 * Math.sin(angle - Math.PI / 6)
    );
    this.ctx.lineTo(
      endStage.x - 10 * Math.cos(angle + Math.PI / 6),
      endStage.y - 10 * Math.sin(angle + Math.PI / 6)
    );
    this.ctx.closePath();
    this.ctx.fillStyle = "#607D8B";
    this.ctx.fill();

    const midX = (startStage.x + endStage.x) / 2;
    const midY = (startStage.y + endStage.y) / 2;
    this.ctx.fillStyle = "#000";
    this.ctx.font = "12px Arial";
    this.ctx.fillText(this.label, midX, midY);
  }
}

class Connector {
  constructor(startStage, endStage, label, action, event, ctx) {
    this.ctx = ctx;
    this.isSelected = false;
    this.event = event;
    this.label = label;
    this.action = action;
    this.startStage = startStage;
    this.endStage = endStage;
  }
}

// Initialize canvas
const canvas = document.getElementById("diagramCanvas");
const ctx = canvas.getContext("2d");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Data structure for stages
let stages = [];

// Data structure for connectors
let connectors = [];

// Currently selected stage (if any)
let selectedStage = null;

// Flag to indicate dragging
let isDragging = false;

// Flag to indicate adding connector mode
let isAddingConnector = false;

// Start and end stages for connector creation
let startStage = null;
let endStage = null;

// Function to draw everything on canvas
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  stages.forEach((stage) => {
    stage.draw();
  });
}

// Function to handle mouse down event on a stage
function onMouseDown(event) {
  const canvasRect = canvas.getBoundingClientRect();
  const mouseX = event.clientX - canvasRect.left;
  const mouseY = event.clientY - canvasRect.top;

  if (isAddingConnector) {
    // Check if the mouse is on a stage
    startStage = stages.find((stage) => {
      const dx = stage.x - mouseX;
      const dy = stage.y - mouseY;
      return Math.sqrt(dx * dx + dy * dy) <= stage.radius;
    });

    isDragging = true;
  } else {
    // Check if the mouse is on a stage
    selectedStage = stages.find((stage) => {
      const dx = stage.x - mouseX;
      const dy = stage.y - mouseY;
      return Math.sqrt(dx * dx + dy * dy) <= stage.radius;
    });

    stages.forEach((stage) => {
      stage.isSelected = false;
    });

    if (!selectedStage) {
      // If clicked outside existing stage, create a new stage
      stages.push(new Stage(ctx, stages.length, mouseX, mouseY, 20, "Stage"));
    } else {
      // If a stage is selected, start dragging it
      selectedStage.isSelected = true;
      isDragging = true;
    }
  }

  draw();
}

// Function to handle mouse move event
function onMouseMove(event) {
  const canvasRect = canvas.getBoundingClientRect();
  const mouseX = event.clientX - canvasRect.left;
  const mouseY = event.clientY - canvasRect.top;

  if (isDragging) {
    if (isAddingConnector) {
      draw();
      // Draw temporary connector
      if (startStage) {
        ctx.beginPath();
        ctx.moveTo(startStage.x, startStage.y);
        ctx.lineTo(mouseX, mouseY);
        ctx.strokeStyle = "#607D8B";
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.closePath();
      }
    } else {
      // Update the selected stage position if dragging
      if (selectedStage) {
        selectedStage.x = mouseX;
        selectedStage.y = mouseY;
      }
      draw();
    }
  }
}

function toggleConnectorMode() {
  isAddingConnector = !isAddingConnector;
}

// Function to handle mouse up event
function onMouseUp(event) {
  isDragging = false;
  const canvasRect = canvas.getBoundingClientRect();
  const mouseX = event.clientX - canvasRect.left;
  const mouseY = event.clientY - canvasRect.top;

  if (isAddingConnector) {
    // Check if the mouse is on a stage
    endStage = stages.find((stage) => {
      const dx = stage.x - mouseX;
      const dy = stage.y - mouseY;
      return Math.sqrt(dx * dx + dy * dy) <= stage.radius;
    });

    if (startStage && endStage && startStage !== endStage) {
      // If both start and end stages are defined and different, create a connector
      if (!startStage.nextStages.includes(endStage)) {
        startStage.nextStages.push(endStage);
      }
      draw();
    }

    startStage = null;
    endStage = null;
  }
}

// Add event listeners
canvas.addEventListener("mousedown", onMouseDown);
canvas.addEventListener("mousemove", onMouseMove);
canvas.addEventListener("mouseup", onMouseUp);
