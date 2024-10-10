import { useState, useRef } from "react";
import * as d3 from "d3";
import RemovablePoint from "./RemovablePoint";
import * as THREE from "three";
import PipeOverlapArea from "./PipeOverlapArea";

let pointIdCounter = 0;

const WaterSlide = () => {
  const [branches, setBranches] = useState([
    { id: 1, points: [], nested: [], type: "normal" }, // Première branche par défaut
  ]);
  const [isEditing, setIsEditing] = useState(true); // Gère le mode édition
  const [isDragging, setIsDragging] = useState(false);
  const [activeBranchIndex, setActiveBranchIndex] = useState(0); // Index de la branche active
  const [isDoubleClick, setIsDoubleClick] = useState(false);
  const [selectedPoint, setSelectedPoint] = useState(null); // Point sélectionné pour le déplacement
  const [branchesForOverlap, setBranchesForOverlap] = useState(null);
  const clickTimeout = useRef(null);

  const generateUniqueId = () => {
    return ++pointIdCounter; // Incrémente le compteur pour chaque nouvel identifiant
  };

  const generatePipePath = (points) => {
    const threePoints = points.map(
      (point) => new THREE.Vector3(point.x, point.y, 0)
    );

    const curve = new THREE.CatmullRomCurve3(
      threePoints,
      false,
      "catmullrom",
      0.5
    );

    const smoothedPoints = curve.getPoints(70);
    const upperPathPoints = [];
    const lowerPathPoints = [];
    const width = 40;

    for (let i = 0; i < smoothedPoints.length - 1; i++) {
      const p1 = smoothedPoints[i];
      const p2 = smoothedPoints[i + 1];
      const dx = p2.x - p1.x;
      const dy = p2.y - p1.y;
      const length = Math.sqrt(dx * dx + dy * dy);
      const offsetX = -(dy / length) * width;
      const offsetY = (dx / length) * width;

      upperPathPoints.push({ x: p1.x + offsetX, y: p1.y + offsetY });
      lowerPathPoints.push({ x: p1.x - offsetX, y: p1.y - offsetY });
    }

    const lineGenerator = d3
      .line()
      .x((d) => d.x)
      .y((d) => d.y);

    const upperPath = lineGenerator(upperPathPoints);
    const lowerPath = lineGenerator(lowerPathPoints.reverse());
    const closedPath = `${upperPath} L ${lowerPath.slice(1)} Z`;

    return { closedPath };
  };

  const addPoint = (branchIndex, x, y) => {
    if (!isDragging && !isDoubleClick) {
      const newPoint = {
        id: generateUniqueId(),
        x,
        y,
      };

      const updatedBranches = branches.map((branch, idx) =>
        idx === branchIndex
          ? { ...branch, points: [...branch.points, newPoint] }
          : branch
      );
      setBranches(updatedBranches);
    }
    setIsDragging(false);
  };

  const addBranch = () => {
    const newBranch = {
      id: generateUniqueId(),
      points: [],
      nested: [],
      type: "normal",
    };

    if (branches.length > 0) {
      // Vérifie la proximité avec les points de la dernière branche ajoutée
      checkProximity(
        newBranch.points,
        branches[branches.length - 1].points,
        newBranch.id
      );
    }

    setBranches([...branches, newBranch]);
    setActiveBranchIndex(branches.length);
  };

  const checkProximity = (newBranchPoints, existingBranchPoints) => {
    const proximityThreshold = 50; // Distance en pixels pour considérer qu'un point est proche

    newBranchPoints.forEach((newPoint) => {
      existingBranchPoints.forEach((existingPoint) => {
        const distance = Math.sqrt(
          Math.pow(newPoint.x - existingPoint.x, 2) +
            Math.pow(newPoint.y - existingPoint.y, 2)
        );

        if (distance < proximityThreshold) {
          console.log(
            `Proximity detected: New point (${newPoint.x}, ${newPoint.y}) is close to existing point (${existingPoint.x}, ${existingPoint.y})`
          );
        }
      });
    });
  };

  const generatePipePathWithClip = (points) => {
    const { closedPath } = generatePipePath(points);
    return (
      <>
        <path d={closedPath} fill="pink" stroke="black" strokeWidth="2" />
      </>
    );
  };

  const movePoint = (branchIndex, pointId, newX, newY) => {
    setIsDragging(true);
    setSelectedPoint({ x: newX, y: newY });
    const updatedBranches = branches.map((branch, idx) =>
      idx === branchIndex
        ? {
            ...branch,
            points: branch.points.map((point) =>
              point.id === pointId ? { ...point, x: newX, y: newY } : point
            ),
          }
        : branch
    );
    setBranches(updatedBranches);

    // Vérifie la proximité après le déplacement du point
    if (branchIndex > 0) {
      // Vérifier la proximité avec les points de toutes les branches existantes
      branches.forEach((existingBranch, idx) => {
        if (idx !== branchIndex) {
          checkProximity(
            updatedBranches[branchIndex].points,
            existingBranch.points
          );
        }
      });
    }
  };

  const removePoint = (branchIndex, pointId) => {
    const updatedBranches = branches.map((branch, idx) =>
      idx === branchIndex
        ? {
            ...branch,
            points: branch.points.filter((point) => point.id !== pointId),
          }
        : branch
    );
    setBranches(updatedBranches);
  };

  const handleSvgClick = (event) => {
    if (clickTimeout.current) {
      clearTimeout(clickTimeout.current);
      clickTimeout.current = null;
      return;
    }

    clickTimeout.current = setTimeout(() => {
      const rect = event.target.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      addPoint(activeBranchIndex, x, y);
      clickTimeout.current = null;
    }, 200);
  };

  const handleDoubleClick = () => {
    setIsDoubleClick(true);
    setTimeout(() => setIsDoubleClick(false), 300);
  };

  const handleDoneClick = () => {
    if (isEditing) {
      // Préparer les branches pour le composant `PipeOverlapArea`
      const branch1 = branches[0]?.points.map(({ x, y }) => ({ x, y })) || [];
      const branch2 = branches[1]?.points.map(({ x, y }) => ({ x, y })) || [];
      setBranchesForOverlap({ branch1, branch2 });
    } else {
      // Réinitialiser les branches pour revenir en mode édition
      setBranchesForOverlap(null);
    }
    setIsEditing(!isEditing);
  };

  return (
    <div className="relative w-[640px] h-[1040px] border border-gray-500 mx-auto mt-10">
      {/* Afficher les branches avec les points si on est en mode édition */}
      {isEditing && (
        <svg
          className="absolute top-0 left-0 w-full h-full bg-gray-100"
          onClick={handleSvgClick}
          onDoubleClick={handleDoubleClick}
        >
          {/* Afficher toutes les branches avec leurs courbes et points */}
          {branches.map((branch, branchIndex) => (
            <g key={branch.id}>
              {branch.points.length > 1 &&
                generatePipePathWithClip(branch.points, `clip-${branch.id}`)}

              {branch.points.map((point) => (
                <RemovablePoint
                  key={point.id}
                  point={point}
                  onMove={(newX, newY) =>
                    movePoint(branchIndex, point.id, newX, newY)
                  }
                  onRemove={() => removePoint(branchIndex, point.id)}
                />
              ))}
            </g>
          ))}
        </svg>
      )}

      {/* Bouton pour ajouter une nouvelle branche normale */}
      <button
        onClick={addBranch}
        className="absolute bottom-20 left-1/2 transform -translate-x-1/2 bg-green-500 text-white px-4 py-2 rounded"
      >
        Add Normal Branch
      </button>

      {branchesForOverlap && !isEditing && (
        <div className="absolute top-0 left-0 w-full h-full" style={{ zIndex: 10 }}>
          <PipeOverlapArea
            branch1={branchesForOverlap.branch1}
            branch2={branchesForOverlap.branch2}
          />
        </div>
      )}

      <button
        onClick={handleDoneClick}
        className="absolute bottom-10 left-1/2 transform -translate-x-1/2 bg-blue-500 text-white px-4 py-2 rounded"
        style={{ zIndex: 20, cursor: "pointer" }}
      >
        {isEditing ? "Done" : "Edit"}
      </button>
    </div>
  );
};

export default WaterSlide;
