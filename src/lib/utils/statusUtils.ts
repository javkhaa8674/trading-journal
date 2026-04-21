// lib/utils/statusUtils.ts

export type AccountStatus = "active" | "archived" | "closed" | string;

interface StatusConfig {
    color: string;
    bgColor: string;
    icon: string;
    label: string;
}

const statusConfig: Record<string, StatusConfig> = {
    active: {
        color: "text-green-800",
        bgColor: "bg-green-50",
        icon: "🟢",
        label: "Active",
    },
    archived: {
        color: "text-yellow-800",
        bgColor: "bg-yellow-50",
        icon: "📦",
        label: "Archived",
    },
    closed: {
        color: "text-red-800",
        bgColor: "bg-red-50",
        icon: "🔴",
        label: "Closed",
    },
    default: {
        color: "text-gray-600",
        bgColor: "bg-gray-50",
        icon: "⚪",
        label: "Unknown",
    },
};

export const getStatusColor = (status: string): string => {
    return statusConfig[status]?.color || statusConfig.default.color;
};

export const getStatusBgColor = (status: string): string => {
    return statusConfig[status]?.bgColor || statusConfig.default.bgColor;
};

export const getStatusIcon = (status: string): string => {
    return statusConfig[status]?.icon || statusConfig.default.icon;
};

export const getStatusLabel = (status: string): string => {
    return statusConfig[status]?.label || statusConfig.default.label;
};

export const getStatusClass = (status: string): string => {
    return `${getStatusColor(status)} ${getStatusBgColor(status)}`;
};

export const getFullStatusInfo = (status: string): StatusConfig => {
    return statusConfig[status] || statusConfig.default;
};

// Status-ийн жагсаалт
export const STATUS_LIST = {
    ACTIVE: "active",
    ARCHIVED: "archived",
    CLOSED: "closed",
} as const;

export const STATUS_OPTIONS = [
    { value: "active", label: "🟢 Active", color: "text-green-800" },
    { value: "archived", label: "📦 Archived", color: "text-yellow-800" },
    { value: "closed", label: "🔴 Closed", color: "text-red-800" },
];