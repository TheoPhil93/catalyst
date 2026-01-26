import { useCallback, useState } from "react";
import ReactFlow, {
  Node,
  Edge,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  Handle,
  Position,
  NodeProps,
  MarkerType
} from "reactflow";
import "reactflow/dist/style.css";
import { 
  Users, 
  Key, 
  Building2, 
  FileBadge, 
  ShieldCheck, 
  MoreHorizontal,
  Plus,
  Save,
  GitBranch,
  Search,
  X,
  AlertTriangle
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import { Switch } from "@/app/components/ui/switch"; // Falls nicht vorhanden, Checkbox nutzen

// --- 1. Custom Node Components ---

// Helper für Styles basierend auf Typ
const getNodeStyles = (type: string) => {
  switch (type) {
    case 'role': // Blue
      return { 
        header: 'bg-blue-600', 
        icon: <Users className="w-3 h-3 text-white" />,
        label: 'Role',
        border: 'border-blue-200 hover:border-blue-400'
      };
    case 'permission': // Green
      return { 
        header: 'bg-emerald-600', 
        icon: <Key className="w-3 h-3 text-white" />,
        label: 'Permission',
        border: 'border-emerald-200 hover:border-emerald-400'
      };
    case 'asset': // Orange
      return { 
        header: 'bg-orange-500', 
        icon: <Building2 className="w-3 h-3 text-white" />,
        label: 'Scope / Asset',
        border: 'border-orange-200 hover:border-orange-400'
      };
    case 'policy': // Purple
      return { 
        header: 'bg-purple-600', 
        icon: <FileBadge className="w-3 h-3 text-white" />,
        label: 'Policy',
        border: 'border-purple-200 hover:border-purple-400'
      };
    default:
      return { header: 'bg-zinc-500', icon: null, label: 'Node', border: 'border-zinc-200' };
  }
};

const GovernanceNode = ({ data, selected }: NodeProps) => {
  const style = getNodeStyles(data.type);

  return (
    <div className={`
      w-[260px] bg-white rounded-lg shadow-sm transition-all duration-200
      border-2 ${selected ? 'ring-2 ring-offset-1 ring-zinc-400 border-zinc-900' : style.border}
    `}>
      {/* Header Strip */}
      <div className={`h-8 px-3 flex items-center justify-between rounded-t-[5px] ${style.header}`}>
        <div className="flex items-center gap-2">
          {style.icon}
          <span className="text-[10px] font-bold text-white uppercase tracking-wider">{style.label}</span>
        </div>
        {/* Optional: Warning Indicator for Invalid Configs */}
        {data.invalid && <AlertTriangle className="w-3 h-3 text-yellow-300" />}
      </div>

      {/* Body */}
      <div className="p-3">
        <div className="font-bold text-sm text-zinc-900 leading-tight mb-1">{data.label}</div>
        <div className="text-[11px] text-zinc-500 mb-3">{data.description}</div>

        {/* Dynamic Footer Content based on Type */}
        {data.type === 'role' && (
           <div className="flex items-center gap-2">
             <div className="flex -space-x-2">
                {[1,2,3].map(i => (
                    <div key={i} className="w-6 h-6 rounded-full border-2 border-white bg-zinc-200 flex items-center justify-center text-[8px] font-medium text-zinc-600">
                        U{i}
                    </div>
                ))}
             </div>
             <span className="text-[10px] text-zinc-400 font-medium">+4 others</span>
           </div>
        )}

        {data.type === 'policy' && (
            <Badge variant="outline" className="text-[10px] bg-purple-50 text-purple-700 border-purple-100">
                Active • v2.1
            </Badge>
        )}
      </div>

      {/* Connection Handles */}
      <Handle type="target" position={Position.Left} className="!w-3 !h-3 !bg-zinc-200 !border-2 !border-white" />
      <Handle type="source" position={Position.Right} className="!w-3 !h-3 !bg-zinc-400 !border-2 !border-white" />
    </div>
  );
};

const nodeTypes = { governanceNode: GovernanceNode };

// --- 2. Initial Data (The Graph) ---

const initialNodes: Node[] = [
  // --- Roles (Blue) ---
  { id: 'R1', type: 'governanceNode', position: { x: 50, y: 100 }, data: { type: 'role', label: 'Uploader', description: 'Can introduce new drafts.' } },
  { id: 'R2', type: 'governanceNode', position: { x: 50, y: 300 }, data: { type: 'role', label: 'Technical Reviewer', description: 'Validates schema & integrity.' } },
  { id: 'R3', type: 'governanceNode', position: { x: 50, y: 500 }, data: { type: 'role', label: 'Final Approver', description: 'Release manager for SBB.' } },

  // --- Permissions (Green) ---
  { id: 'P1', type: 'governanceNode', position: { x: 400, y: 100 }, data: { type: 'permission', label: 'Upload FDK', description: 'Import .xlsx/.xml files.' } },
  { id: 'P2', type: 'governanceNode', position: { x: 400, y: 300 }, data: { type: 'permission', label: 'Review Changes', description: 'Access to comparison view.' } },
  { id: 'P3', type: 'governanceNode', position: { x: 400, y: 500 }, data: { type: 'permission', label: 'Final Release', description: 'Publish to Production.' } },

  // --- Policies (Purple) ---
  { id: 'POL1', type: 'governanceNode', position: { x: 750, y: 300 }, data: { type: 'policy', label: 'Approval Policy', description: 'Requires 2-eyes principle.' } },

  // --- Scope / Assets (Orange) ---
  { id: 'S1', type: 'governanceNode', position: { x: 1100, y: 200 }, data: { type: 'asset', label: 'SBB Catalog', description: 'Production Environment' } },
  { id: 'S2', type: 'governanceNode', position: { x: 1100, y: 400 }, data: { type: 'asset', label: 'AB Catalog', description: 'Production Environment' } },
];

const initialEdges: Edge[] = [
  // Roles -> Permissions
  { id: 'e1', source: 'R1', target: 'P1', animated: true, label: 'Granted', style: { stroke: '#cbd5e1' } },
  { id: 'e2', source: 'R2', target: 'P2', animated: true, label: 'Granted', style: { stroke: '#cbd5e1' } },
  { id: 'e3', source: 'R3', target: 'P3', animated: true, label: 'Granted', style: { stroke: '#cbd5e1' } },
  
  // Permissions -> Policy
  { id: 'e4', source: 'P2', target: 'POL1', type: 'smoothstep', style: { stroke: '#a855f7', strokeWidth: 2 } },
  { id: 'e5', source: 'P3', target: 'POL1', type: 'smoothstep', style: { stroke: '#a855f7', strokeWidth: 2 } },

  // Policy -> Assets
  { id: 'e6', source: 'POL1', target: 'S1', type: 'smoothstep', markerEnd: { type: MarkerType.ArrowClosed }, label: 'Applies to' },
  { id: 'e7', source: 'POL1', target: 'S2', type: 'smoothstep', markerEnd: { type: MarkerType.ArrowClosed }, label: 'Applies to' },
];

export function GovernancePage() {
  const [nodes, , onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);

  const onNodeClick = useCallback((event: any, node: Node) => {
    setSelectedNode(node);
  }, []);

  const closePanel = () => setSelectedNode(null);

  return (
    <div className="h-full flex flex-col bg-zinc-50 relative">
      
      {/* --- Top Toolbar (Governance Context) --- */}
      <div className="h-14 bg-white border-b border-zinc-200 px-6 flex items-center justify-between shrink-0 z-10">
        <div className="flex items-center gap-4">
            <h2 className="text-sm font-bold text-zinc-900 uppercase tracking-wide">Governance Graph</h2>
            <div className="h-4 w-px bg-zinc-200" />
            <div className="flex items-center gap-2">
                <Badge variant="secondary" className="bg-zinc-100 text-zinc-600 font-normal hover:bg-zinc-200 cursor-pointer">
                    <GitBranch className="w-3 h-3 mr-1" /> main
                </Badge>
                <Badge variant="secondary" className="bg-blue-50 text-blue-700 font-normal hover:bg-blue-100 cursor-pointer border-blue-100">
                    <ShieldCheck className="w-3 h-3 mr-1" /> v2.4 Active
                </Badge>
            </div>
        </div>
        <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="h-8 text-xs">
                <Save className="w-3 h-3 mr-2" /> Save Draft
            </Button>
            <Button size="sm" className="h-8 text-xs bg-zinc-900">
                Publish Changes
            </Button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden relative">
        {/* --- Main Canvas --- */}
        <div className="flex-1 relative bg-zinc-50">
            {/* Grid Pattern */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#e5e7eb_1px,transparent_1px),linear-gradient(to_bottom,#e5e7eb_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
            
            <ReactFlow
                nodes={nodes}
                edges={edges}
                nodeTypes={nodeTypes}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onNodeClick={onNodeClick}
                fitView
                className="bg-transparent"
                minZoom={0.5}
                maxZoom={1.5}
            >
                <Background color="transparent" />
                <Controls className="!bg-white !border-zinc-200 !shadow-sm !rounded-lg !m-4" />
                <MiniMap 
                    className="!bg-white !border-zinc-200 !shadow-sm !rounded-lg !bottom-4 !left-4" 
                    nodeColor={(n) => {
                        if (n.data.type === 'role') return '#2563eb';
                        if (n.data.type === 'permission') return '#059669';
                        if (n.data.type === 'policy') return '#9333ea';
                        return '#f97316';
                    }}
                />
            </ReactFlow>
        </div>

        {/* --- Right Side Panel (Details) --- */}
        {selectedNode && (
            <div className="w-[400px] bg-white border-l border-zinc-200 shadow-xl flex flex-col z-20 animate-in slide-in-from-right duration-200 absolute right-0 top-0 bottom-0">
                
                {/* Panel Header */}
                <div className="p-5 border-b border-zinc-100 flex justify-between items-start bg-zinc-50/50">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <Badge variant="outline" className="uppercase text-[10px] tracking-wide bg-white">{selectedNode.data.type}</Badge>
                            <span className="text-[10px] text-zinc-400 font-mono">{selectedNode.id}</span>
                        </div>
                        <h3 className="text-lg font-bold text-zinc-900">{selectedNode.data.label}</h3>
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={closePanel}><X className="w-4 h-4" /></Button>
                </div>

                {/* Panel Content */}
                <div className="flex-1 overflow-y-auto p-5 space-y-6">
                    
                    {/* Description */}
                    <div>
                        <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-2 block">Description</label>
                        <p className="text-sm text-zinc-700 leading-relaxed bg-zinc-50 p-3 rounded border border-zinc-100">
                            {selectedNode.data.description}
                        </p>
                    </div>

                    {/* Dynamic Sections */}
                    {selectedNode.data.type === 'role' && (
                        <div>
                            <div className="flex justify-between items-center mb-3">
                                <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">Assigned Users</label>
                                <Button variant="ghost" size="sm" className="h-6 text-[10px] text-blue-600"><Plus className="w-3 h-3 mr-1"/> Add User</Button>
                            </div>
                            <div className="space-y-2">
                                {['Hans Müller', 'Anna Schmidt', 'Peter Weber'].map(user => (
                                    <div key={user} className="flex items-center justify-between p-2 border border-zinc-100 rounded bg-white hover:border-zinc-200 transition-colors">
                                        <div className="flex items-center gap-2">
                                            <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold">
                                                {user.charAt(0)}
                                            </div>
                                            <span className="text-sm text-zinc-700">{user}</span>
                                        </div>
                                        <MoreHorizontal className="w-4 h-4 text-zinc-400 cursor-pointer" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {selectedNode.data.type === 'policy' && (
                        <div>
                            <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-3 block">Approval Rules</label>
                            <div className="space-y-3">
                                <div className="flex items-start gap-3">
                                    <Switch />
                                    <div>
                                        <p className="text-sm font-medium text-zinc-900">Require Quorum</p>
                                        <p className="text-xs text-zinc-500">At least 50% of assigned approvers must sign off.</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <Switch defaultChecked />
                                    <div>
                                        <p className="text-sm font-medium text-zinc-900">Sequential Approval</p>
                                        <p className="text-xs text-zinc-500">Technical review must pass before domain approval.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {selectedNode.data.type === 'permission' && (
                        <div className="p-4 bg-emerald-50 rounded border border-emerald-100">
                            <div className="flex gap-3">
                                <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                                <div>
                                    <h4 className="text-sm font-bold text-emerald-900">Active Permission</h4>
                                    <p className="text-xs text-emerald-700 mt-1 leading-relaxed">
                                        This permission allows write access to the FDK staging environment. Modifications are logged in the audit trail.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                </div>
                
                {/* Panel Footer */}
                <div className="p-4 border-t border-zinc-200 bg-zinc-50 flex justify-end gap-2">
                    <Button variant="outline" onClick={closePanel}>Cancel</Button>
                    <Button className="bg-zinc-900">Apply Changes</Button>
                </div>
            </div>
        )}
      </div>
    </div>
  );
}