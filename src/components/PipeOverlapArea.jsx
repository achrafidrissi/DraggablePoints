import { useEffect, useRef } from "react";
import * as d3 from "d3";
import * as THREE from "three";
import polygonClipping from "polygon-clipping";

// Fonction pour générer le chemin du tuyau
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

  return { closedPath, points: [...upperPathPoints, ...lowerPathPoints] };
};

// Composant React pour afficher l'intersection
const PipeOverlapArea = ({ branch1, branch2 }) => {
  const svgRef = useRef();

  useEffect(() => {
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove(); // Nettoyage

    const { points: points1 } = generatePipePath(branch1);
    const { points: points2 } = generatePipePath(branch2);

    const poly1 = [points1.map((p) => [p.x, p.y])];
    const poly2 = [points2.map((p) => [p.x, p.y])];

    const intersection = polygonClipping.intersection(poly1, poly2);

    svg.append("defs").append("filter").attr("id", "glow").html(`
        <feGaussianBlur stdDeviation="2.5" result="coloredBlur"/>
        <feMerge>
          <feMergeNode in="coloredBlur"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      `);

    const { closedPath: path1 } = generatePipePath(branch1);
    const { closedPath: path2 } = generatePipePath(branch2);

    svg
      .append("path")
      .attr("d", path2)
      .attr("fill", "#D81B60")
      .attr("stroke", "#000000")
      .attr("stroke-width", 3)
      .attr("filter", "url(#glow)");

    svg
      .append("path")
      .attr("d", path1)
      .attr("fill", "#D81B60")
      .attr("stroke", "#000000")
      .attr("stroke-width", 3)
      .attr("filter", "url(#glow)");

    const union = polygonClipping.union(poly1, poly2);
    if (union.length > 0) {
        console.log("fghjk")
      const pathGenerator = d3
        .line()
        .x((d) => d[0])
        .y((d) => d[1]);

      union.forEach((part) => {
        const pathData = pathGenerator(part[0]);
        svg
          .append("path")
          .attr("d", pathData)
          .attr("fill", "#D81B60")
          .attr("stroke", "#000000")
          .attr("stroke-width", 1);
      });
    }
  }, [branch1, branch2]);

  return (
    <svg
      ref={svgRef}
      width={640}
      height={1040}
      viewBox="0 0 600 800"
      style={{ border: "1px solid black" }}
    />
  );
};

export default PipeOverlapArea;
