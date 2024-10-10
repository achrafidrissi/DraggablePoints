import { useState, useEffect } from "react";
import PropTypes from "prop-types";

const RemovablePoint = ({ point, onMove, onRemove }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  const handleMouseDown = (e) => {
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
    setIsDragging(false);
  };

  const handleDoubleClick = (e) => {
    e.stopPropagation(); // Empêche l'événement de se propager au SVG
    onRemove(point.id); // Supprime le point
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
      fill="red"
      stroke="black"
      strokeWidth="2"
      onMouseDown={handleMouseDown}
      onDoubleClick={handleDoubleClick} // Double-clic pour supprimer avec stopPropagation()
    />
  );
};

// Validation des props
RemovablePoint.propTypes = {
  point: PropTypes.shape({
    id: PropTypes.number.isRequired,
    x: PropTypes.number.isRequired,
    y: PropTypes.number.isRequired,
  }).isRequired,
  onMove: PropTypes.func.isRequired,
  onRemove: PropTypes.func.isRequired,
};

export default RemovablePoint;
