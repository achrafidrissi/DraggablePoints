import { useState, useEffect } from "react";
import PropTypes from "prop-types";

const DraggablePoint = ({ point, onMove }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  const handleMouseDown = (e) => {
    // Calculer l'offset entre la position du curseur et le centre du point
    const offsetX = e.clientX - point.x;
    const offsetY = e.clientY - point.y;
    setOffset({ x: offsetX, y: offsetY });
    setIsDragging(true);
  };

  const handleMouseMove = (e) => {
    if (isDragging) {
      const newX = e.clientX - offset.x;
      const newY = e.clientY - offset.y;
      onMove(newX, newY);
    }
  };

  const handleMouseUp = () => {
    if (isDragging) {
      setIsDragging(false);
    }
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    } else {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging]);

  return (
    <circle
      cx={point.x}
      cy={point.y}
      r="10"
      fill="blue"
      stroke="black"
      strokeWidth="2"
      onMouseDown={handleMouseDown}
    />
  );
};

// Validation des props
DraggablePoint.propTypes = {
  point: PropTypes.shape({
    id: PropTypes.number.isRequired,
    x: PropTypes.number.isRequired,
    y: PropTypes.number.isRequired,
  }).isRequired,
  onMove: PropTypes.func.isRequired,
};

export default DraggablePoint;
