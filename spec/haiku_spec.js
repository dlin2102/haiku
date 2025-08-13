import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as d3 from 'd3';
import { ChevronLeft, Users, Target, FileText, Building2, Zap, ZoomIn, ZoomOut, Maximize } from 'lucide-react';

// Mock data structure
const mockData = {
  organizations: [
    { id: 'org1', name: 'Engineering Division', color: '#8B5CF6', teams: ['team1', 'team2', 'team3'] },
    { id: 'org2', name: 'Product Division', color: '#06B6D4', teams: ['team4', 'team5'] }
  ],
  teams: [
    { id: 'team1', name: 'Frontend Team', color: '#10B981', orgId: 'org1', epics: ['epic1', 'epic2'], connections: ['team2'] },
    { id: 'team2', name: 'Backend Team', color: '#F59E0B', orgId: 'org1', epics: ['epic3', 'epic4'], connections: ['team1', 'team3'] },
    { id: 'team3', name: 'DevOps Team', color: '#EF4444', orgId: 'org1', epics: ['epic5'], connections: ['team2'] },
    { id: 'team4', name: 'Design Team', color: '#8B5CF6', orgId: 'org2', epics: ['epic6'], connections: ['team5'] },
    { id: 'team5', name: 'Research Team', color: '#06B6D4', orgId: 'org2', epics: ['epic7'], connections: ['team4'] }
  ],
  epics: [
    { id: 'epic1', name: 'UI Redesign', color: '#10B981', teamId: 'team1', tickets: ['ticket1', 'ticket2'] },
    { id: 'epic2', name: 'Performance Optimization', color: '#10B981', teamId: 'team1', tickets: ['ticket3'] },
    { id: 'epic3', name: 'API Gateway', color: '#F59E0B', teamId: 'team2', tickets: ['ticket4', 'ticket5'] },
    { id: 'epic4', name: 'Database Migration', color: '#F59E0B', teamId: 'team2', tickets: ['ticket6'] },
    { id: 'epic5', name: 'CI/CD Pipeline', color: '#EF4444', teamId: 'team3', tickets: ['ticket7'] },
    { id: 'epic6', name: 'Design System', color: '#8B5CF6', teamId: 'team4', tickets: ['ticket8'] },
    { id: 'epic7', name: 'User Research', color: '#06B6D4', teamId: 'team5', tickets: ['ticket9'] }
  ],
  tickets: [
    { id: 'ticket1', name: 'Header Component', status: 'In Progress', epicId: 'epic1' },
    { id: 'ticket2', name: 'Navigation Menu', status: 'Done', epicId: 'epic1' },
    { id: 'ticket3', name: 'Bundle Size Reduction', status: 'To Do', epicId: 'epic2' },
    { id: 'ticket4', name: 'Rate Limiting', status: 'In Progress', epicId: 'epic3' },
    { id: 'ticket5', name: 'Authentication Service', status: 'Done', epicId: 'epic3' },
    { id: 'ticket6', name: 'Schema Updates', status: 'In Progress', epicId: 'epic4' },
    { id: 'ticket7', name: 'Deploy Automation', status: 'Done', epicId: 'epic5' },
    { id: 'ticket8', name: 'Color Tokens', status: 'To Do', epicId: 'epic6' },
    { id: 'ticket9', name: 'User Interviews', status: 'In Progress', epicId: 'epic7' }
  ]
};

// Node component
const Node = ({ data, position, onClick, isSelected }) => {
  const { label, level, color, metadata } = data;
  
  const getIcon = () => {
    const iconProps = { size: level === 'tickets' ? 16 : 20, className: "flex-shrink-0" };
    switch (level) {
      case 'organizations': return <Building2 {...iconProps} />;
      case 'teams': return <Users {...iconProps} />;
      case 'epics': return <Target {...iconProps} />;
      case 'tickets': return <FileText {...iconProps} />;
      default: return <Zap {...iconProps} />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Done': return '#10B981';
      case 'In Progress': return '#F59E0B';
      case 'To Do': return '#6B7280';
      default: return color;
    }
  };

  const nodeWidth = level === 'tickets' ? 200 : 220;
  
  return (
    <div
      className={`absolute bg-white rounded-xl shadow-lg border-2 transition-all duration-300 cursor-pointer hover:shadow-xl hover:scale-105 ${
        isSelected ? 'border-blue-500 shadow-blue-200' : 'border-gray-200'
      }`}
      style={{
        left: position.x,
        top: position.y,
        width: nodeWidth,
        borderColor: isSelected ? '#3B82F6' : color,
        transform: 'translate(-50%, -50%)'
      }}
      onClick={onClick}
    >
      <div 
        className="h-2 rounded-t-lg"
        style={{ backgroundColor: level === 'tickets' ? getStatusColor(metadata?.status) : color }}
      />
      <div className="p-4">
        <div className="flex items-center gap-3">
          <div 
            className="p-2 rounded-lg flex-shrink-0"
            style={{ backgroundColor: `${color}20`, color: color }}
          >
            {getIcon()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-gray-900 text-sm truncate">
              {label}
            </div>
            {metadata?.count && (
              <div className="text-xs text-gray-500 mt-1">
                {metadata.count} items
              </div>
            )}
            {metadata?.status && (
              <div className="text-xs mt-1" style={{ color: getStatusColor(metadata.status) }}>
                {metadata.status}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Connection line component
const ConnectionLine = ({ start, end, animated = false }) => (
  <svg
    className="absolute pointer-events-none"
    style={{
      left: 0,
      top: 0,
      width: '100%',
      height: '100%',
      zIndex: 1
    }}
  >
    <defs>
      <marker
        id="arrowhead"
        markerWidth="10"
        markerHeight="7"
        refX="9"
        refY="3.5"
        orient="auto"
      >
        <polygon
          points="0 0, 10 3.5, 0 7"
          fill="#6B7280"
        />
      </marker>
    </defs>
    <path
      d={`M ${start.x} ${start.y} Q ${(start.x + end.x) / 2} ${start.y - 50} ${end.x} ${end.y}`}
      stroke="#6B7280"
      strokeWidth="2"
      fill="none"
      markerEnd="url(#arrowhead)"
      className={animated ? "animate-pulse" : ""}
      strokeDasharray={animated ? "5,5" : "none"}
    />
  </svg>
);

export default function TeamVisualizer() {
  const [currentLevel, setCurrentLevel] = useState('teams');
  const [selectedParent, setSelectedParent] = useState(null);
  const [breadcrumb, setBreadcrumb] = useState(['teams']);
  const [nodes, setNodes] = useState([]);
  const [connections, setConnections] = useState([]);
  const [selectedNode, setSelectedNode] = useState(null);
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const containerRef = useRef(null);

  const createLayout = useCallback((level, parentId = null) => {
    let data = [];
    let nodeConnections = [];

    switch (level) {
      case 'organizations':
        data = mockData.organizations.map(org => ({
          ...org,
          metadata: { count: org.teams.length }
        }));
        break;
      case 'teams':
        data = parentId 
          ? mockData.teams.filter(team => team.orgId === parentId)
          : mockData.teams;
        data = data.map(team => ({
          ...team,
          metadata: { count: team.epics.length }
        }));
        nodeConnections = data.flatMap(team => 
          team.connections ? team.connections.map(connId => ({ from: team.id, to: connId })) : []
        );
        break;
      case 'epics':
        data = parentId 
          ? mockData.epics.filter(epic => epic.teamId === parentId)
          : mockData.epics;
        data = data.map(epic => ({
          ...epic,
          metadata: { count: epic.tickets.length }
        }));
        break;
      case 'tickets':
        data = parentId 
          ? mockData.tickets.filter(ticket => ticket.epicId === parentId)
          : mockData.tickets;
        data = data.map(ticket => ({
          ...ticket,
          metadata: { status: ticket.status }
        }));
        break;
    }

    // Calculate positions using a force-directed layout approach
    const containerWidth = 1200;
    const containerHeight = 800;
    const nodeSpacing = 280;
    
    const nodesPerRow = Math.ceil(Math.sqrt(data.length));
    const totalWidth = (nodesPerRow - 1) * nodeSpacing;
    const totalHeight = (Math.ceil(data.length / nodesPerRow) - 1) * 200;
    
    const startX = (containerWidth - totalWidth) / 2;
    const startY = (containerHeight - totalHeight) / 2;

    const layoutNodes = data.map((item, index) => ({
      id: item.id,
      data: {
        label: item.name,
        level: level,
        color: item.color,
        metadata: item.metadata,
      },
      position: {
        x: startX + (index % nodesPerRow) * nodeSpacing,
        y: startY + Math.floor(index / nodesPerRow) * 200,
      },
    }));

    // Filter connections to only include nodes that exist in current view
    const validConnections = nodeConnections.filter(conn => 
      layoutNodes.some(n => n.id === conn.from) && layoutNodes.some(n => n.id === conn.to)
    );

    setNodes(layoutNodes);
    setConnections(validConnections);
  }, []);

  const handleNodeClick = (nodeId, level) => {
    const nextLevels = {
      'organizations': 'teams',
      'teams': 'epics',
      'epics': 'tickets',
    };

    if (nextLevels[level]) {
      const nextLevel = nextLevels[level];
      setCurrentLevel(nextLevel);
      setSelectedParent(nodeId);
      setBreadcrumb(prev => [...prev, nextLevel]);
      setSelectedNode(null);
    }
  };

  const handleBack = useCallback(() => {
    if (breadcrumb.length > 1) {
      const newBreadcrumb = breadcrumb.slice(0, -1);
      const previousLevel = newBreadcrumb[newBreadcrumb.length - 1];
      
      setBreadcrumb(newBreadcrumb);
      setCurrentLevel(previousLevel);
      setSelectedNode(null);
      
      if (newBreadcrumb.length === 1) {
        setSelectedParent(null);
      }
    }
  }, [breadcrumb]);

  const handleMouseDown = (e) => {
    if (e.target === containerRef.current) {
      setIsDragging(true);
      setDragStart({
        x: e.clientX - transform.x,
        y: e.clientY - transform.y
      });
    }
  };

  const handleMouseMove = (e) => {
    if (isDragging) {
      setTransform(prev => ({
        ...prev,
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      }));
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleZoom = (factor) => {
    setTransform(prev => ({
      ...prev,
      scale: Math.max(0.1, Math.min(3, prev.scale * factor))
    }));
  };

  const resetView = () => {
    setTransform({ x: 0, y: 0, scale: 1 });
  };

  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.key === 'Escape') {
        handleBack();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    
    return () => {
      window.removeEventListener('keydown', handleKeyPress);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleBack, isDragging, dragStart]);

  useEffect(() => {
    createLayout(currentLevel, selectedParent);
  }, [createLayout, currentLevel, selectedParent]);

  const getLevelTitle = () => {
    const titles = {
      'organizations': 'Organizations',
      'teams': 'Teams',
      'epics': 'Epics',
      'tickets': 'Tickets'
    };
    return titles[currentLevel];
  };

  return (
    <div className="w-full h-screen bg-gradient-to-br from-slate-50 to-slate-100 overflow-hidden">
      {/* Header Panel */}
      <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm rounded-xl shadow-lg p-4 border border-gray-200 z-20">
        <div className="flex items-center gap-3 mb-3">
          {breadcrumb.length > 1 && (
            <button
              onClick={handleBack}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Go back (ESC)"
            >
              <ChevronLeft size={20} className="text-gray-600" />
            </button>
          )}
          <h1 className="text-xl font-bold text-gray-900">{getLevelTitle()}</h1>
        </div>
        
        <div className="flex items-center gap-2 text-sm text-gray-600">
          {breadcrumb.map((level, index) => (
            <React.Fragment key={level}>
              {index > 0 && <span className="text-gray-400">/</span>}
              <span className={index === breadcrumb.length - 1 ? 'font-medium text-gray-900' : ''}>
                {level}
              </span>
            </React.Fragment>
          ))}
        </div>
        
        <div className="mt-3 text-xs text-gray-500">
          Click nodes to drill down • Press ESC to go back • Drag to pan
        </div>
      </div>

      {/* Controls Panel */}
      <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200 z-20">
        <div className="flex flex-col gap-1 p-2">
          <button
            onClick={() => handleZoom(1.2)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="Zoom In"
          >
            <ZoomIn size={18} />
          </button>
          <button
            onClick={() => handleZoom(0.8)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="Zoom Out"
          >
            <ZoomOut size={18} />
          </button>
          <button
            onClick={resetView}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="Reset View"
          >
            <Maximize size={18} />
          </button>
        </div>
      </div>

      {/* Legend Panel */}
      <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-sm rounded-xl shadow-lg p-3 border border-gray-200 z-20">
        <div className="text-sm font-medium text-gray-700 mb-2">Legend</div>
        <div className="space-y-2">
          {currentLevel === 'tickets' ? (
            <>
              <div className="flex items-center gap-2 text-xs">
                <div className="w-3 h-2 bg-green-500 rounded"></div>
                <span>Done</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <div className="w-3 h-2 bg-yellow-500 rounded"></div>
                <span>In Progress</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <div className="w-3 h-2 bg-gray-500 rounded"></div>
                <span>To Do</span>
              </div>
            </>
          ) : (
            <div className="text-xs text-gray-500">
              Lines show team connections
            </div>
          )}
        </div>
      </div>

      {/* Main Canvas */}
      <div
        ref={containerRef}
        className="w-full h-full relative cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
        style={{
          transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
          transformOrigin: '50% 50%'
        }}
      >
        {/* Background Pattern */}
        <div 
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: `radial-gradient(circle, #e2e8f0 1px, transparent 1px)`,
            backgroundSize: '20px 20px'
          }}
        />

        {/* Connection Lines */}
        {connections.map(conn => {
          const startNode = nodes.find(n => n.id === conn.from);
          const endNode = nodes.find(n => n.id === conn.to);
          if (!startNode || !endNode) return null;
          
          return (
            <ConnectionLine
              key={`${conn.from}-${conn.to}`}
              start={startNode.position}
              end={endNode.position}
              animated={true}
            />
          );
        })}

        {/* Nodes */}
        {nodes.map(node => (
          <Node
            key={node.id}
            data={node.data}
            position={node.position}
            onClick={() => {
              setSelectedNode(node.id);
              handleNodeClick(node.id, node.data.level);
            }}
            isSelected={selectedNode === node.id}
          />
        ))}
      </div>
    </div>
  );
}
