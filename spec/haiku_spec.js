import React, { useState, useCallback, useEffect } from 'react';
import ReactFlow, {
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  ConnectionMode,
  Panel,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { ChevronLeft, Users, Target, FileText, Building } from 'lucide-react';

// Mock data structure - replace with actual Jira API calls
const mockData = {
  organizations: [
    { id: 'org1', name: 'Engineering Division', description: 'Core product engineering teams' },
    { id: 'org2', name: 'Data & Analytics', description: 'Data science and analytics teams' },
  ],
  teams: [
    { id: 'team1', name: 'Frontend Team', orgId: 'org1', description: 'React & UI/UX', members: 8, connections: ['team2', 'team3'] },
    { id: 'team2', name: 'Backend Team', orgId: 'org1', description: 'APIs & Infrastructure', members: 12, connections: ['team1', 'team4'] },
    { id: 'team3', name: 'Mobile Team', orgId: 'org1', description: 'iOS & Android', members: 6, connections: ['team1'] },
    { id: 'team4', name: 'Platform Team', orgId: 'org1', description: 'DevOps & Platform', members: 10, connections: ['team2'] },
    { id: 'team5', name: 'Data Science', orgId: 'org2', description: 'ML & Analytics', members: 7, connections: ['team6'] },
    { id: 'team6', name: 'Data Engineering', orgId: 'org2', description: 'ETL & Infrastructure', members: 9, connections: ['team5'] },
  ],
  epics: [
    { id: 'epic1', name: 'User Dashboard Redesign', teamId: 'team1', status: 'In Progress', progress: 65 },
    { id: 'epic2', name: 'Component Library v2', teamId: 'team1', status: 'Planning', progress: 20 },
    { id: 'epic3', name: 'API Gateway Migration', teamId: 'team2', status: 'In Progress', progress: 80 },
    { id: 'epic4', name: 'Authentication Service', teamId: 'team2', status: 'Done', progress: 100 },
    { id: 'epic5', name: 'iOS App Redesign', teamId: 'team3', status: 'In Progress', progress: 45 },
    { id: 'epic6', name: 'CI/CD Pipeline', teamId: 'team4', status: 'In Progress', progress: 90 },
  ],
  tickets: [
    { id: 'ticket1', name: 'User Profile Component', epicId: 'epic1', priority: 'High', assignee: 'Sarah Chen' },
    { id: 'ticket2', name: 'Dashboard Layout', epicId: 'epic1', priority: 'High', assignee: 'Mike Johnson' },
    { id: 'ticket3', name: 'Button Components', epicId: 'epic2', priority: 'Medium', assignee: 'Alex Kim' },
    { id: 'ticket4', name: 'API Documentation', epicId: 'epic3', priority: 'Medium', assignee: 'David Wilson' },
    { id: 'ticket5', name: 'Load Balancer Config', epicId: 'epic3', priority: 'High', assignee: 'Emma Davis' },
    { id: 'ticket6', name: 'Home Screen Redesign', epicId: 'epic5', priority: 'High', assignee: 'James Brown' },
  ]
};

// Custom node components
const OrganizationNode = ({ data }) => (
  <div className="px-6 py-4 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl shadow-lg border-2 border-purple-300 text-white min-w-[200px]">
    <div className="flex items-center gap-3 mb-2">
      <Building size={20} />
      <h3 className="font-bold text-lg">{data.name}</h3>
    </div>
    <p className="text-purple-100 text-sm">{data.description}</p>
  </div>
);

const TeamNode = ({ data }) => (
  <div className="px-5 py-4 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl shadow-lg border-2 border-emerald-300 text-white min-w-[180px]">
    <div className="flex items-center gap-3 mb-2">
      <Users size={18} />
      <h3 className="font-semibold text-lg">{data.name}</h3>
    </div>
    <p className="text-emerald-100 text-sm mb-2">{data.description}</p>
    <div className="text-emerald-100 text-xs">{data.members} members</div>
  </div>
);

const EpicNode = ({ data }) => {
  const statusColor = {
    'Planning': 'bg-yellow-500',
    'In Progress': 'bg-blue-500',
    'Done': 'bg-green-500'
  };

  return (
    <div className="px-5 py-4 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl shadow-lg border-2 border-orange-300 text-white min-w-[170px]">
      <div className="flex items-center gap-3 mb-2">
        <Target size={18} />
        <h3 className="font-semibold">{data.name}</h3>
      </div>
      <div className="flex items-center gap-2 mb-2">
        <div className={`px-2 py-1 rounded-full text-xs font-medium ${statusColor[data.status]}`}>
          {data.status}
        </div>
      </div>
      <div className="w-full bg-orange-200 rounded-full h-2">
        <div 
          className="bg-white rounded-full h-2 transition-all duration-300" 
          style={{ width: `${data.progress}%` }}
        ></div>
      </div>
      <div className="text-orange-100 text-xs mt-1">{data.progress}% complete</div>
    </div>
  );
};

const TicketNode = ({ data }) => {
  const priorityColor = {
    'High': 'bg-red-500',
    'Medium': 'bg-yellow-500',
    'Low': 'bg-green-500'
  };

  return (
    <div className="px-4 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg shadow-lg border-2 border-indigo-300 text-white min-w-[160px]">
      <div className="flex items-center gap-2 mb-2">
        <FileText size={16} />
        <h4 className="font-medium text-sm">{data.name}</h4>
      </div>
      <div className="flex items-center gap-2 mb-1">
        <div className={`px-2 py-1 rounded-full text-xs font-medium ${priorityColor[data.priority]}`}>
          {data.priority}
        </div>
      </div>
      <div className="text-indigo-100 text-xs">{data.assignee}</div>
    </div>
  );
};

const nodeTypes = {
  organization: OrganizationNode,
  team: TeamNode,
  epic: EpicNode,
  ticket: TicketNode,
};

export default function TeamVisualizer() {
  const [currentLevel, setCurrentLevel] = useState('teams');
  const [currentParent, setCurrentParent] = useState(null);
  const [breadcrumb, setBreadcrumb] = useState([]);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  const levelConfig = {
    organizations: { icon: Building, title: 'Organizations' },
    teams: { icon: Users, title: 'Teams' },
    epics: { icon: Target, title: 'Epics' },
    tickets: { icon: FileText, title: 'Tickets' }
  };

  const generateLayout = useCallback((items, connections = []) => {
    const radius = Math.max(200, items.length * 40);
    const centerX = 400;
    const centerY = 300;

    return items.map((item, index) => {
      const angle = (2 * Math.PI * index) / items.length;
      const x = centerX + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);

      return {
        id: item.id,
        type: currentLevel.slice(0, -1), // Remove 's' from plural
        position: { x: x - 100, y: y - 50 },
        data: item,
      };
    });
  }, [currentLevel]);

  const generateEdges = useCallback((items, connections = []) => {
    const edges = [];
    
    connections.forEach(connection => {
      edges.push({
        id: `${connection.source}-${connection.target}`,
        source: connection.source,
        target: connection.target,
        type: 'smoothstep',
        style: { stroke: '#94a3b8', strokeWidth: 2 },
        animated: true,
      });
    });

    return edges;
  }, []);

  const loadLevel = useCallback((level, parentId = null) => {
    let items = [];
    let connections = [];

    switch (level) {
      case 'organizations':
        items = mockData.organizations;
        break;
      case 'teams':
        items = parentId 
          ? mockData.teams.filter(team => team.orgId === parentId)
          : mockData.teams;
        
        // Create connections between sister teams
        connections = items.flatMap(team => 
          (team.connections || [])
            .filter(connId => items.some(t => t.id === connId))
            .map(connId => ({ source: team.id, target: connId }))
        );
        break;
      case 'epics':
        items = parentId 
          ? mockData.epics.filter(epic => epic.teamId === parentId)
          : mockData.epics;
        break;
      case 'tickets':
        items = parentId 
          ? mockData.tickets.filter(ticket => ticket.epicId === parentId)
          : mockData.tickets;
        break;
    }

    const newNodes = generateLayout(items);
    const newEdges = generateEdges(items, connections);
    
    setNodes(newNodes);
    setEdges(newEdges);
  }, [generateLayout, generateEdges, setNodes, setEdges]);

  const onNodeClick = useCallback((event, node) => {
    const levelOrder = ['organizations', 'teams', 'epics', 'tickets'];
    const currentIndex = levelOrder.indexOf(currentLevel);
    
    if (currentIndex < levelOrder.length - 1) {
      const nextLevel = levelOrder[currentIndex + 1];
      const newBreadcrumb = [...breadcrumb, { level: currentLevel, parent: currentParent, name: node.data.name }];
      
      setBreadcrumb(newBreadcrumb);
      setCurrentLevel(nextLevel);
      setCurrentParent(node.id);
      loadLevel(nextLevel, node.id);
    }
  }, [currentLevel, currentParent, breadcrumb, loadLevel]);

  const goBack = useCallback(() => {
    if (breadcrumb.length > 0) {
      const previous = breadcrumb[breadcrumb.length - 1];
      const newBreadcrumb = breadcrumb.slice(0, -1);
      
      setBreadcrumb(newBreadcrumb);
      setCurrentLevel(previous.level);
      setCurrentParent(previous.parent);
      loadLevel(previous.level, previous.parent);
    }
  }, [breadcrumb, loadLevel]);

  // Handle ESC key
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        goBack();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goBack]);

  // Load initial level
  useEffect(() => {
    loadLevel(currentLevel, currentParent);
  }, []);

  const config = levelConfig[currentLevel];
  const IconComponent = config.icon;

  return (
    <div className="w-full h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        nodeTypes={nodeTypes}
        connectionMode={ConnectionMode.Loose}
        fitView
        className="bg-transparent"
      >
        <Background color="#334155" />
        <Controls className="bg-slate-800 border-slate-600" />
        
        <Panel position="top-left" className="bg-slate-800/90 backdrop-blur-sm rounded-lg p-4 border border-slate-600">
          <div className="flex items-center gap-4">
            {breadcrumb.length > 0 && (
              <button
                onClick={goBack}
                className="flex items-center gap-2 px-3 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-white transition-colors"
              >
                <ChevronLeft size={18} />
                Back
              </button>
            )}
            
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${
                currentLevel === 'organizations' ? 'bg-purple-500' :
                currentLevel === 'teams' ? 'bg-emerald-500' :
                currentLevel === 'epics' ? 'bg-orange-500' : 'bg-indigo-500'
              }`}>
                <IconComponent size={24} className="text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">{config.title}</h1>
                {breadcrumb.length > 0 && (
                  <div className="text-slate-400 text-sm">
                    {breadcrumb.map((crumb, index) => (
                      <span key={index}>
                        {index > 0 && ' > '}
                        {crumb.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </Panel>

        <Panel position="bottom-right" className="bg-slate-800/90 backdrop-blur-sm rounded-lg p-3 border border-slate-600">
          <div className="text-slate-300 text-sm">
            <div className="font-medium mb-1">Navigation</div>
            <div>• Click nodes to drill down</div>
            <div>• Press ESC or Back to go up</div>
            <div>• Connected lines show relationships</div>
          </div>
        </Panel>
      </ReactFlow>
    </div>
  );
}
