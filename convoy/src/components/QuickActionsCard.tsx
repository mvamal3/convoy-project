import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Car, Users, Route, TrendingUp } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface QuickActionsProps {
  openModal: () => void;
  openDriverModal: () => void;
}

const QuickActionsCard: React.FC<QuickActionsProps> = ({
  openModal,
  openDriverModal,
}) => {
  const navigate = useNavigate();

  return (
    <Card className="md:col-span-1 lg:col-span-2 bg-gray-50 rounded-xl shadow border-0">
      <CardHeader>
        <CardTitle className="text-md font-semibold text-gray-800">
          Quick Actions
        </CardTitle>
        <CardDescription className="text-gray-600">
          Common tasks you might want to perform
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div
            onClick={openModal}
            className="p-4 border rounded-lg bg-blue-50 hover:bg-blue-100 transition cursor-pointer"
          >
            <Car className="h-6 w-6 text-blue-600 mb-2" />
            <div className="text-sm font-medium text-blue-800">Add Vehicle</div>
          </div>
          <div
            onClick={openDriverModal}
            className="p-4 border rounded-lg bg-teal-50 hover:bg-teal-100 transition cursor-pointer"
          >
            <Users className="h-6 w-6 text-teal-600 mb-2" />
            <div className="text-sm font-medium text-teal-800">Add Driver</div>
          </div>
          <div
            onClick={() => navigate("/AddTrip")}
            className="p-4 border rounded-lg bg-violet-50 hover:bg-violet-100 transition cursor-pointer"
          >
            <Route className="h-6 w-6 text-violet-600 mb-2" />
            <div className="text-sm font-medium text-violet-800">Plan Trip</div>
          </div>
          <div
            onClick={() => navigate("/managetrip")}
            className="p-4 border rounded-lg bg-orange-50 hover:bg-orange-100 transition cursor-pointer"
          >
            <TrendingUp className="h-6 w-6 text-orange-600 mb-2" />
            <div className="text-sm font-medium text-orange-800">
              View All Trips
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default QuickActionsCard;
