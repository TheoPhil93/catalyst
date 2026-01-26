import { useCallback, useState } from "react";
import ReactFlow, {
  Node,
  Edge,
  addEdge,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  Handle,
  Position,
  NodeProps,
  ReactFlowProvider,
  useReactFlow,
  Panel,
} from "reactflow";
import "reactflow/dist/style.css";
import {
  GitBranch,
  Calendar,
  User,
  ChevronDown,
  ChevronRight,
  Layers,
  Search,
  GripVertical,
  ArrowRightLeft,
  FileText,
} from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Badge } from "@/app/components/ui/badge";
import { ScrollArea } from "@/app/components/ui/scroll-area";

// --- Types & Constants ---

type OrgColor = "blue" | "red" | "orange" | "purple";

/**
 * Domain/Brand colors (intentionally kept).
 * Neutral surfaces/borders/text are tokenized below.
 */
const ORG_CONFIG: Record<
  string,
  { label: string; color: OrgColor; twColor: string; twBorder: string; twBg: string }
> = {
  SBB: {
    label: "Schweizerische Bundesbahn",
    color: "blue",
    twColor: "bg-blue-600",
    twBorder: "border-blue-200",
    twBg: "bg-blue-50",
  },
  AB: {
    label: "Appenzeller Bahn",
    color: "red",
    twColor: "bg-red-600",
    twBorder: "border-red-200",
    twBg: "bg-red-50",
  },
  AVA: {
    label: "Aargauer Verkehrs AG",
    color: "orange",
    twColor: "bg-orange-500",
    twBorder: "border-orange-200",
    twBg: "bg-orange-50",
  },
  "R+P": {
    label: "Rosenthaler & Partner",
    color: "purple",
    twColor: "bg-purple-600",
    twBorder: "border-purple-200",
    twBg: "bg-purple-50",
  },
};

// --- Custom Nodes ---

// 1) Version Node
const VersionNode = ({ data, selected }: NodeProps) => {
  const config = ORG_CONFIG[data.org] || ORG_CONFIG["SBB"];

  return (
    <div
      className={[
        "w-[240px] bg-card rounded-md shadow-sm transition-all duration-200 group border",
        selected
          ? "ring-2 ring-ring/60 border-ring"
          : "border-border hover:border-ring/40",
      ].join(" ")}
    >
      {/* Header Stripe (domain color) */}
      <div className={`h-1 w-full rounded-t-md ${config.twColor}`} />

      <div className="p-3">
        <div className="flex items-center justify-between mb-1">
          <Badge
            variant="outline"
            className="text-[10px] h-5 px-1.5 font-medium border-border bg-muted text-foreground"
          >
            <span className={`inline-flex h-1.5 w-1.5 rounded-full mr-1.5 ${config.twColor}`} />
            {data.org}
          </Badge>

          <Badge
            variant={data.status === "active" ? "default" : "secondary"}
            className="text-[10px] h-5 px-1.5 font-normal"
          >
            {data.status}
          </Badge>
        </div>

        <div className="flex items-center gap-2 mb-2">
          <FileText className="w-4 h-4 text-muted-foreground" />
          <span className="font-semibold text-sm text-foreground">{data.version}</span>
        </div>

        <div className="flex flex-col gap-1 text-[10px] text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3 h-3" /> {data.date}
          </div>
          <div className="flex items-center gap-1.5">
            <User className="w-3 h-3" /> {data.author}
          </div>
        </div>
      </div>

      <Handle
        type="target"
        position={Position.Left}
        className="!w-2 !h-2 !bg-border !border-2 !border-background"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="!w-2 !h-2 !bg-muted-foreground !border-2 !border-background"
      />
    </div>
  );
};

// 2) Cluster Group Node
const ClusterNode = ({ data, id }: NodeProps) => {
  const config = ORG_CONFIG[data.org] || ORG_CONFIG["SBB"];
  const { setNodes } = useReactFlow();

  const toggleExpand = (e: React.MouseEvent) => {
    e.stopPropagation();
    const newExpanded = !data.expanded;

    setNodes((nds) =>
      nds.map((n) => {
        if (n.id === id) {
          return {
            ...n,
            data: { ...n.data, expanded: newExpanded },
            style: { ...n.style, height: newExpanded ? data.initialHeight : 50 },
          };
        }
        if (n.parentNode === id) {
          return { ...n, hidden: !newExpanded };
        }
        return n;
      })
    );
  };

  return (
    <div
      className={[
        "h-full w-full rounded-lg border-2 border-dashed transition-all duration-300",
        "bg-muted/20 border-border",
        config.twBorder, // domain accent border
      ].join(" ")}
    >
      <div
        className="absolute -top-4 left-4 bg-card px-2 py-1 rounded-md border border-border shadow-sm flex items-center gap-2 cursor-pointer hover:bg-muted/30"
        onClick={toggleExpand}
      >
        <div className={`w-2 h-2 rounded-full ${config.twColor}`} />
        <span className="text-xs font-bold text-foreground">{config.label}</span>
        <Badge variant="secondary" className="text-[10px] h-4 px-1">
          {data.count}
        </Badge>
        {data.expanded ? (
          <ChevronDown className="w-3 h-3 text-muted-foreground" />
        ) : (
          <ChevronRight className="w-3 h-3 text-muted-foreground" />
        )}
      </div>
    </div>
  );
};

const nodeTypes = {
  versionNode: VersionNode,
  clusterNode: ClusterNode,
};

// --- Mock Data ---

const SIDEBAR_VERSIONS = [
  { org: "SBB", versions: ["13.2.1", "13.2.2-draft"] },
  { org: "AB", versions: ["13.1.0", "13.1.1"] },
  { org: "AVA", versions: ["14.0.0-beta"] },
  { org: "R+P", versions: ["12.9.9"] },
];

const INITIAL_NODES: Node[] = [
  // Clusters
  {
    id: "C_SBB",
    type: "clusterNode",
    position: { x: 50, y: 50 },
    data: { org: "SBB", count: 5, expanded: true, initialHeight: 600 },
    style: { width: 300, height: 600, zIndex: -1 },
  },
  {
    id: "C_AB",
    type: "clusterNode",
    position: { x: 400, y: 50 },
    data: { org: "AB", count: 2, expanded: true, initialHeight: 350 },
    style: { width: 300, height: 350, zIndex: -1 },
  },
  {
    id: "C_AVA",
    type: "clusterNode",
    position: { x: 400, y: 450 },
    data: { org: "AVA", count: 3, expanded: true, initialHeight: 450 },
    style: { width: 300, height: 450, zIndex: -1 },
  },
  {
    id: "C_RP",
    type: "clusterNode",
    position: { x: 750, y: 200 },
    data: { org: "R+P", count: 2, expanded: true, initialHeight: 350 },
    style: { width: 300, height: 350, zIndex: -1 },
  },

  // Nodes SBB
  {
    id: "sbb1",
    type: "versionNode",
    parentNode: "C_SBB",
    position: { x: 30, y: 40 },
    extent: "parent",
    data: { org: "SBB", version: "FDK 13.2.0", status: "active", date: "Today", author: "System" },
  },
  {
    id: "sbb2",
    type: "versionNode",
    parentNode: "C_SBB",
    position: { x: 30, y: 150 },
    extent: "parent",
    data: { org: "SBB", version: "FDK 13.1.9", status: "archived", date: "Jan 10", author: "H. Müller" },
  },
  {
    id: "sbb3",
    type: "versionNode",
    parentNode: "C_SBB",
    position: { x: 30, y: 260 },
    extent: "parent",
    data: { org: "SBB", version: "FDK 13.1.8", status: "archived", date: "Jan 05", author: "A. Schmidt" },
  },
  {
    id: "sbb4",
    type: "versionNode",
    parentNode: "C_SBB",
    position: { x: 30, y: 370 },
    extent: "parent",
    data: { org: "SBB", version: "FDK 13.1.7", status: "archived", date: "Dec 22", author: "System" },
  },
  {
    id: "sbb5",
    type: "versionNode",
    parentNode: "C_SBB",
    position: { x: 30, y: 480 },
    extent: "parent",
    data: { org: "SBB", version: "FDK 13.1.6", status: "archived", date: "Dec 15", author: "H. Müller" },
  },

  // Nodes AB
  {
    id: "ab1",
    type: "versionNode",
    parentNode: "C_AB",
    position: { x: 30, y: 40 },
    extent: "parent",
    data: { org: "AB", version: "FDK 13.0.2", status: "active", date: "Jan 15", author: "P. Weber" },
  },
  {
    id: "ab2",
    type: "versionNode",
    parentNode: "C_AB",
    position: { x: 30, y: 150 },
    extent: "parent",
    data: { org: "AB", version: "FDK 13.0.1", status: "archived", date: "Jan 02", author: "P. Weber" },
  },

  // Nodes AVA
  {
    id: "ava1",
    type: "versionNode",
    parentNode: "C_AVA",
    position: { x: 30, y: 40 },
    extent: "parent",
    data: { org: "AVA", version: "FDK 14.0.0", status: "draft", date: "Yesterday", author: "K. Lee" },
  },
  {
    id: "ava2",
    type: "versionNode",
    parentNode: "C_AVA",
    position: { x: 30, y: 150 },
    extent: "parent",
    data: { org: "AVA", version: "FDK 13.9.0", status: "active", date: "Jan 12", author: "System" },
  },
  {
    id: "ava3",
    type: "versionNode",
    parentNode: "C_AVA",
    position: { x: 30, y: 260 },
    extent: "parent",
    data: { org: "AVA", version: "FDK 13.8.5", status: "archived", date: "Dec 20", author: "K. Lee" },
  },

  // Nodes R+P
  {
    id: "rp1",
    type: "versionNode",
    parentNode: "C_RP",
    position: { x: 30, y: 40 },
    extent: "parent",
    data: { org: "R+P", version: "FDK 12.9.8", status: "active", date: "Jan 18", author: "Admin" },
  },
  {
    id: "rp2",
    type: "versionNode",
    parentNode: "C_RP",
    position: { x: 30, y: 150 },
    extent: "parent",
    data: { org: "R+P", version: "FDK 12.9.7", status: "archived", date: "Jan 01", author: "Admin" },
  },
];

const INITIAL_EDGES: Edge[] = [
  {
    id: "e1",
    source: "sbb1",
    target: "ab1",
    animated: true,
    style: { stroke: "var(--muted-foreground)", strokeWidth: 2 },
  },
  {
    id: "e2",
    source: "sbb1",
    target: "ava2",
    animated: true,
    style: { stroke: "var(--muted-foreground)", strokeWidth: 2 },
  },
];

// --- Main Page Component ---

export function ComparePage() {
  return (
    <ReactFlowProvider>
      <CompareInterface />
    </ReactFlowProvider>
  );
}

function CompareInterface() {
  const [nodes, setNodes, onNodesChange] = useNodesState(INITIAL_NODES);
  const [edges, setEdges, onEdgesChange] = useEdgesState(INITIAL_EDGES);
  const [isLibraryOpen, setIsLibraryOpen] = useState(true);

  const onDragStart = (event: React.DragEvent, version: string, org: string) => {
    event.dataTransfer.setData("application/reactflow", JSON.stringify({ version, org }));
    event.dataTransfer.effectAllowed = "move";
  };

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const dataStr = event.dataTransfer.getData("application/reactflow");
      if (!dataStr) return;

      const { version, org } = JSON.parse(dataStr);

      // Simplified position calc (OK for UI demo)
      const position = { x: event.clientX - 300, y: event.clientY - 100 };

      const newNode: Node = {
        id: `dropped_${Math.random()}`,
        type: "versionNode",
        position,
        data: { org, version: `FDK ${version}`, status: "draft", date: "Just now", author: "Me" },
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [setNodes]
  );

  return (
    <div className="h-full flex bg-background overflow-hidden">
      {/* Main Canvas Area */}
      <div className="flex-1 flex flex-col relative" onDragOver={onDragOver} onDrop={onDrop}>
        {/* Toolbar */}
        <div className="h-14 bg-card border-b border-border px-6 flex items-center justify-between shrink-0 z-10">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Comparison Editor</h2>
            <p className="text-xs text-muted-foreground hidden sm:block">
              Drag nodes to connect and generate diff reports.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setIsLibraryOpen(!isLibraryOpen)}>
              <Layers className="w-4 h-4 mr-2" />
              {isLibraryOpen ? "Hide Library" : "Show Library"}
            </Button>
            <Button size="sm">
              <ArrowRightLeft className="w-4 h-4 mr-2" />
              Run Comparison
            </Button>
          </div>
        </div>

        <div className="flex-1 bg-background relative">
          {/* Background Grid (token-based) */}
          <div className="absolute inset-0 bg-[radial-gradient(var(--border)_1px,transparent_1px)] [background-size:20px_20px]" />

          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            nodeTypes={nodeTypes}
            onConnect={(params) =>
              setEdges((eds) =>
                addEdge(
                  { ...params, animated: true, style: { stroke: "var(--primary)", strokeWidth: 2 } },
                  eds
                )
              )
            }
            fitView
            className="bg-transparent"
            minZoom={0.2}
          >
            <Background color="transparent" />

            <Controls className="!bg-card !border-border !shadow-sm !rounded-lg !m-4" />

            <MiniMap
              className="!bg-card !border-border !shadow-sm !rounded-lg !bottom-4 !left-4"
              nodeColor={(n) => {
                if (n.type === "clusterNode") return "var(--muted)";
                return "var(--card)";
              }}
            />

            <Panel
              position="bottom-center"
              className="bg-card px-4 py-2 rounded-full border border-border shadow-sm text-xs text-muted-foreground mb-8"
            >
              {edges.length} active comparisons linked
            </Panel>
          </ReactFlow>
        </div>
      </div>

      {/* Right Sidebar - Version Library */}
      {isLibraryOpen && (
        <div className="w-80 bg-card border-l border-border flex flex-col shrink-0 animate-in slide-in-from-right duration-300">
          <div className="p-4 border-b border-border bg-muted/20">
            <h3 className="font-semibold text-foreground mb-1">Version Library</h3>

            <div className="relative">
              <Search className="absolute left-2.5 top-2 w-3.5 h-3.5 text-muted-foreground" />
              <input
                className="w-full bg-input-background border border-border rounded-md py-1.5 pl-8 pr-3 text-xs text-foreground
                           focus:outline-none focus:ring-2 focus:ring-ring/30 transition-all
                           placeholder:text-muted-foreground"
                placeholder="Search versions..."
              />
            </div>
          </div>

          <ScrollArea className="flex-1 p-4">
            <div className="space-y-6">
              {SIDEBAR_VERSIONS.map((group) => {
                const config = ORG_CONFIG[group.org];
                return (
                  <div key={group.org}>
                    <div className="flex items-center gap-2 mb-2">
                      <div className={`w-1.5 h-1.5 rounded-full ${config.twColor}`} />
                      <span className="text-xs font-bold text-foreground">{config.label}</span>
                    </div>

                    <div className="space-y-2 pl-3 border-l border-border/60">
                      {group.versions.map((ver) => (
                        <div
                          key={ver}
                          draggable
                          onDragStart={(e) => onDragStart(e, ver, group.org)}
                          className="flex items-center justify-between p-2 rounded-md border border-border bg-card
                                     hover:border-ring/40 hover:bg-muted/20 hover:shadow-sm cursor-grab active:cursor-grabbing
                                     transition-all group"
                        >
                          <div className="flex items-center gap-2">
                            <GripVertical className="w-3 h-3 text-muted-foreground/60" />
                            <div>
                              <div className="text-xs font-medium text-foreground">FDK {ver}</div>
                              <div className="text-[10px] text-muted-foreground">Available</div>
                            </div>
                          </div>

                          <PlusButton />
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>

          <div className="p-4 border-t border-border bg-muted/20">
            <div className="text-[10px] text-muted-foreground text-center">
              Drag versions onto the canvas to start comparing.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const PlusButton = () => (
  <div className="w-6 h-6 rounded hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
    <GitBranch className="w-3 h-3" />
  </div>
);
