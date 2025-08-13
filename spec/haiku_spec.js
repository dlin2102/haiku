import React, { useState, useCallback, useEffect } from 'react';
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Panel,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { ChevronLeft, Users, Target, FileText, Building2, Zap } from 'lucide-react';

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

// Custom node components
const CustomNode = ({ data, selected }) => {
  const { label, level, color, onClick, metadata } = data;
  
  const getIcon = () => {
    switch (level) {
      case 'organizations': return <Building2 size={20} />;
      case 'teams': return <Users size={20} />;
      case 'epics': return <Target size={20} />;
      case 'tickets': return <FileText size={16} />;
      default: return <Zap size={20} />;
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

  return (
    <div
      className={`relative bg-white rounded-xl shadow-lg border-2 transition-all duration-200 cursor-pointer hover:shadow-xl hover:scale-105 ${
        selected ? 'border-blue-500 shadow-blue-200' : 'border-gray-200'
      }`}
      style={{ borderColor: selected ? '#3B82F6' : color }}
      onClick={onClick}
    >
      <div 
        className="h-2 rounded-t-lg"
        style={{ backgroundColor: level === 'tickets' ? getStatusColor(metadata?.status) : color }}
      />
      <div className="p-4">
        <div className="flex items-center gap-3">
          <div 
            className="p-2 rounded-lg"
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

const nodeTypes = {
  custom: CustomNode,
};

export default function TeamVisualizer() {
  const [currentLevel, setCurrentLevel] = useState('teams');
  const [selectedParent, setSelectedParent] = useState(null);
  const [breadcrumb, setBreadcrumb] = useState(['teams']);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  const onConnect = useCallback((params) => setEdges((eds) => addEdge(params, eds)), [setEdges]);

  const createNodes = useCallback((level, parentId = null) => {
    let data = [];
    let connections = [];

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
        connections = data.flatMap(team => 
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

    const nodeSpacing = 300;
    const nodesPerRow = Math.ceil(Math.sqrt(data.length));

    const newNodes = data.map((item, index) => ({
      id: item.id,
      type: 'custom',
      position: {
        x: (index % nodesPerRow) * nodeSpacing,
        y: Math.floor(index / nodesPerRow) * 200,
      },
      data: {
        label: item.name,
        level: level,
        color: item.color,
        metadata: item.metadata,
        onClick: () => handleNodeClick(item.id, level),
      },
    }));

    const newEdges = connections.map(conn => ({
      id: `${conn.from}-${conn.to}`,
      source: conn.from,
      target: conn.to,
      type: 'smoothstep',
      style: { stroke: '#6B7280', strokeWidth: 2 },
      animated: true,
    }));

    setNodes(newNodes);
    setEdges(newEdges.filter(edge => 
      newNodes.some(n => n.id === edge.source) && newNodes.some(n => n.id === edge.target)
    ));
  }, [setNodes, setEdges]);

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
      createNodes(nextLevel, nodeId);
    }
  };

  const handleBack = () => {
    if (breadcrumb.length > 1) {
      const newBreadcrumb = breadcrumb.slice(0, -1);
      const previousLevel = newBreadcrumb[newBreadcrumb.length - 1];
      
      setBreadcrumb(newBreadcrumb);
      setCurrentLevel(previousLevel);
      
      if (newBreadcrumb.length === 1) {
        setSelectedParent(null);
        createNodes(previousLevel);
      } else {
        // Find the parent for the previous level
        const levelMap = ['organizations', 'teams', 'epics', 'tickets'];
        const currentIndex = levelMap.indexOf(previousLevel);
        if (currentIndex > 0) {
          createNodes(previousLevel, selectedParent);
        }
      }
    }
  };

  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.key === 'Escape') {
        handleBack();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [breadcrumb, selectedParent]);

  useEffect(() => {
    createNodes(currentLevel, selectedParent);
  }, [createNodes, currentLevel, selectedParent]);

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
    <div className="w-full h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        fitView
        className="bg-transparent"
      >
        <Background color="#e2e8f0" gap={20} />
        
        <Panel position="top-left" className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg p-4 border border-gray-200">
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
            Click nodes to drill down • Press ESC to go back
          </div>
        </Panel>

        <Panel position="top-right" className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg p-3 border border-gray-200">
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
        </Panel>

        <Controls className="bg-white/90 backdrop-blur-sm border border-gray-200 rounded-lg" />
        <MiniMap 
          className="bg-white/90 backdrop-blur-sm border border-gray-200 rounded-lg"
          nodeColor={(node) => node.data.color}
        />
      </ReactFlow>
    </div>
  );
}
