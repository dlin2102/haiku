import React, { useState, useCallback, useEffect, useMemo } from 'react';
import ReactFlow, {
  Node,
  Edge,
  useNodesState,
  useEdgesState,
  Controls,
  MiniMap,
  Background,
  BackgroundVariant,
  Panel,
  MarkerType
} from 'reactflow';
import 'reactflow/dist/style.css';

// Mock Jira data structure
const mockData = {
  organizations: [
    { id: 'org1', name: 'Engineering Org', teams: ['team1', 'team2', 'team3'] },
    { id: 'org2', name: 'Product Org', teams: ['team3', 'team4'] }
  ],
  teams: [
    { id: 'team1', name: 'Platform Team', epics: ['epic1', 'epic2'], sisters: ['team2', 'team3'] },
    { id: 'team2', name: 'Frontend Team', epics: ['epic3', 'epic4'], sisters: ['team1'] },
    { id: 'team3', name: 'Backend Team', epics: ['epic2', 'epic5'], sisters: ['team1', 'team4'] },
    { id: 'team4', name: 'Mobile Team', epics: ['epic6'], sisters: ['team3'] }
  ],
  epics: [
    { id: 'epic1', name: 'Authentication System', tickets: ['ticket1', 'ticket2'], status: 'in-progress' },
    { id: 'epic2', name: 'API Redesign', tickets: ['ticket3', 'ticket4'], status: 'in-progress' },
    { id: 'epic3', name: 'UI Component Library', tickets: ['ticket5'], status: 'planning' },
    { id: 'epic4', name: 'Performance Optimization', tickets: ['ticket6', 'ticket7'], status: 'in-progress' },
    { id: 'epic5', name: 'Database Migration', tickets: ['ticket8'], status: 'completed' },
    { id: 'epic6', name: 'iOS App Refactor', tickets: ['ticket9', 'ticket10'], status: 'in-progress' }
  ],
  tickets: [
    { id: 'ticket1', name: 'Implement OAuth2', assignee: 'Alice', status: 'in-review' },
    { id: 'ticket2', name: 'Add MFA support', assignee: 'Bob', status: 'in-progress' },
    { id: 'ticket3', name: 'GraphQL endpoint', assignee: 'Charlie', status: 'in-progress' },
    { id: 'ticket4', name: 'REST deprecation', assignee: 'David', status: 'todo' },
    { id: 'ticket5', name: 'Button component', assignee: 'Eve', status: 'done' },
    { id: 'ticket6', name: 'Lazy loading', assignee: 'Frank', status: 'in-progress' },
    { id: 'ticket7', name: 'Bundle optimization', assignee: 'Grace', status: 'in-review' },
    { id: 'ticket8', name: 'Schema migration', assignee: 'Henry', status: 'done' },
    { id: 'ticket9', name: 'SwiftUI migration', assignee: 'Iris', status: 'in-progress' },
    { id: 'ticket10', name: 'iOS 17 support', assignee: 'Jack', status: 'testing' }
  ]
};

// Custom node component
const CustomNode = ({ data }) => {
  const getNodeStyle = () => {
    const baseStyle = {
      padding: '16px 24px',
      borderRadius: '12px',
      border: '2px solid',
      fontWeight: '600',
      fontSize: '14px',
      cursor: 'pointer',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      minWidth: '150px',
      textAlign: 'center'
    };

    switch (data.level) {
      case 'organization':
        return {
          ...baseStyle,
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          borderColor: '#5a67d8',
          color: 'white'
        };
      case 'team':
        return {
          ...baseStyle,
          background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
          borderColor: '#e53e3e',
          color: 'white'
        };
      case 'epic':
        const epicColors = {
          'completed': { bg: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)', border: '#48bb78' },
          'in-progress': { bg: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)', border: '#f6ad55' },
          'planning': { bg: 'linear-gradient(135deg, #30cfd0 0%, #330867 100%)', border: '#4299e1' }
        };
        const colors = epicColors[data.status] || epicColors['planning'];
        return {
          ...baseStyle,
          background: colors.bg,
          borderColor: colors.border,
          color: 'white'
        };
      case 'ticket':
        const ticketColors = {
          'done': '#48bb78',
          'in-review': '#4299e1',
          'in-progress': '#ed8936',
          'testing': '#9f7aea',
          'todo': '#718096'
        };
        return {
          ...baseStyle,
          background: `linear-gradient(135deg, ${ticketColors[data.status]}dd 0%, ${ticketColors[data.status]}99 100%)`,
          borderColor: ticketColors[data.status],
          color: 'white',
          fontSize: '12px',
          padding: '12px 16px'
        };
      default:
        return baseStyle;
    }
  };

  return (
    <div style={getNodeStyle()} onClick={() => data.onClick && data.onClick(data)}>
      <div style={{ fontWeight: 'bold', marginBottom: data.subtitle ? '4px' : '0' }}>
        {data.label}
      </div>
      {data.subtitle && (
        <div style={{ fontSize: '12px', opacity: 0.9 }}>
          {data.subtitle}
        </div>
      )}
    </div>
  );
};

const nodeTypes = {
  custom: CustomNode
};

export default function TeamVisualization() {
  const [currentLevel, setCurrentLevel] = useState('team');
  const [currentContext, setCurrentContext] = useState(null);
  const [navigationStack, setNavigationStack] = useState([]);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  const generateNodesAndEdges = useCallback((level, context = null) => {
    const newNodes = [];
    const newEdges = [];
    
    switch (level) {
      case 'organization':
        const orgs = mockData.organizations;
        orgs.forEach((org, index) => {
          newNodes.push({
            id: org.id,
            type: 'custom',
            position: { x: 250 * index, y: 100 },
            data: {
              label: org.name,
              subtitle: `${org.teams.length} teams`,
              level: 'organization',
              onClick: (data) => handleNodeClick(org.id, 'team')
            }
          });
        });
        break;

      case 'team':
        const teams = context 
          ? mockData.teams.filter(t => mockData.organizations.find(o => o.id === context)?.teams.includes(t.id))
          : mockData.teams;
        
        teams.forEach((team, index) => {
          const row = Math.floor(index / 2);
          const col = index % 2;
          newNodes.push({
            id: team.id,
            type: 'custom',
            position: { x: 300 * col, y: 150 * row },
            data: {
              label: team.name,
              subtitle: `${team.epics.length} epics`,
              level: 'team',
              onClick: (data) => handleNodeClick(team.id, 'epic')
            }
          });
        });

        // Add sister team connections
        teams.forEach(team => {
          team.sisters?.forEach(sisterId => {
            if (teams.find(t => t.id === sisterId)) {
              const edgeId = `${team.id}-${sisterId}`;
              const reverseEdgeId = `${sisterId}-${team.id}`;
              if (!newEdges.find(e => e.id === reverseEdgeId)) {
                newEdges.push({
                  id: edgeId,
                  source: team.id,
                  target: sisterId,
                  type: 'smoothstep',
                  animated: true,
                  style: { stroke: '#cbd5e0', strokeWidth: 2 },
                  markerEnd: { type: MarkerType.ArrowClosed, color: '#cbd5e0' }
                });
              }
            }
          });
        });
        break;

      case 'epic':
        const epics = context
          ? mockData.epics.filter(e => mockData.teams.find(t => t.id === context)?.epics.includes(e.id))
          : mockData.epics;
        
        epics.forEach((epic, index) => {
          const row = Math.floor(index / 3);
          const col = index % 3;
          newNodes.push({
            id: epic.id,
            type: 'custom',
            position: { x: 250 * col, y: 150 * row },
            data: {
              label: epic.name,
              subtitle: `${epic.tickets.length} tickets • ${epic.status}`,
              level: 'epic',
              status: epic.status,
              onClick: (data) => handleNodeClick(epic.id, 'ticket')
            }
          });
        });
        break;

      case 'ticket':
        const tickets = context
          ? mockData.tickets.filter(t => mockData.epics.find(e => e.id === context)?.tickets.includes(t.id))
          : mockData.tickets;
        
        tickets.forEach((ticket, index) => {
          const row = Math.floor(index / 3);
          const col = index % 3;
          newNodes.push({
            id: ticket.id,
            type: 'custom',
            position: { x: 220 * col, y: 120 * row },
            data: {
              label: ticket.name,
              subtitle: `${ticket.assignee} • ${ticket.status}`,
              level: 'ticket',
              status: ticket.status
            }
          });
        });
        break;
    }

    setNodes(newNodes);
    setEdges(newEdges);
  }, [setNodes, setEdges]);

  const handleNodeClick = useCallback((nodeId, nextLevel) => {
    setNavigationStack(prev => [...prev, { level: currentLevel, context: currentContext }]);
    setCurrentLevel(nextLevel);
    setCurrentContext(nodeId);
  }, [currentLevel, currentContext]);

  const handleBack = useCallback(() => {
    if (navigationStack.length > 0) {
      const previousState = navigationStack[navigationStack.length - 1];
      setCurrentLevel(previousState.level);
      setCurrentContext(previousState.context);
      setNavigationStack(prev => prev.slice(0, -1));
    }
  }, [navigationStack]);

  // Handle ESC key
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.key === 'Escape') {
        handleBack();
      }
    };
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [handleBack]);

  // Generate nodes and edges when level or context changes
  useEffect(() => {
    generateNodesAndEdges(currentLevel, currentContext);
  }, [currentLevel, currentContext, generateNodesAndEdges]);

  const getBreadcrumbs = () => {
    const crumbs = [];
    navigationStack.forEach((item, index) => {
      const name = item.level.charAt(0).toUpperCase() + item.level.slice(1);
      crumbs.push(
        <span key={index}>
          <span style={{ opacity: 0.6 }}>{name}</span>
          <span style={{ margin: '0 8px', opacity: 0.4 }}>›</span>
        </span>
      );
    });
    crumbs.push(
      <span key="current" style={{ fontWeight: 'bold' }}>
        {currentLevel.charAt(0).toUpperCase() + currentLevel.slice(1)}
      </span>
    );
    return crumbs;
  };

  return (
    <div style={{ width: '100vw', height: '100vh', background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        fitView
        attributionPosition="bottom-left"
      >
        <Background color="#ffffff" variant={BackgroundVariant.Dots} gap={20} size={1} />
        <Controls />
        <MiniMap 
          nodeColor={node => {
            if (node.data?.level === 'organization') return '#667eea';
            if (node.data?.level === 'team') return '#f093fb';
            if (node.data?.level === 'epic') return '#fa709a';
            return '#30cfd0';
          }}
          style={{
            backgroundColor: '#1a202c',
            border: '1px solid #2d3748'
          }}
        />
        
        <Panel position="top-left" style={{
          background: 'rgba(26, 32, 44, 0.95)',
          backdropFilter: 'blur(10px)',
          padding: '16px 24px',
          borderRadius: '12px',
          color: 'white',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <div style={{ marginBottom: '12px', fontSize: '12px', opacity: 0.7 }}>
            Navigation (ESC to go back)
          </div>
          <div style={{ fontSize: '16px' }}>
            {getBreadcrumbs()}
          </div>
        </Panel>

        <Panel position="top-right" style={{
          background: 'rgba(26, 32, 44, 0.95)',
          backdropFilter: 'blur(10px)',
          padding: '12px 16px',
          borderRadius: '12px',
          color: 'white',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <div style={{ fontSize: '12px', opacity: 0.7, marginBottom: '8px' }}>Level</div>
          <div style={{ fontSize: '18px', fontWeight: 'bold' }}>
            {currentLevel.charAt(0).toUpperCase() + currentLevel.slice(1)}s View
          </div>
        </Panel>

        {navigationStack.length > 0 && (
          <Panel position="bottom-right">
            <button
              onClick={handleBack}
              style={{
                background: 'rgba(26, 32, 44, 0.95)',
                backdropFilter: 'blur(10px)',
                color: 'white',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '8px',
                padding: '8px 16px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '600',
                transition: 'all 0.2s'
              }}
              onMouseEnter={e => e.target.style.transform = 'scale(1.05)'}
              onMouseLeave={e => e.target.style.transform = 'scale(1)'}
            >
              ← Back (ESC)
            </button>
          </Panel>
        )}
      </ReactFlow>
    </div>
  );
}
