export type TableStatus = "available" | "occupied" | "reserved" | "cleaning";

export interface Table {
  id: string;
  number: string;
  capacity: number | null;
  status: TableStatus;
  location: string | null;
  qrAssigned: boolean;
  qrScans: number;
}

export const getStatusColor = (status: TableStatus) => {
  switch (status) {
    case "available":
      return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
    case "occupied":
      return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
    case "reserved":
      return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
    case "cleaning":
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
  }
};
