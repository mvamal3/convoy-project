import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";
import {
  Shield,
  Users,
  Car,
  CheckCircle,
  ArrowRight,
  Phone,
  Mail,
  MapPin,
} from "lucide-react";
export default function HomeFooter() {
  return (
    <footer className="bg-gray-900 text-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <div className="bg-blue-600 text-white p-2 rounded-lg">
                <span className="font-bold">CMS</span>
              </div>
              <span className="font-semibold">Convoy Management System</span>
            </div>
            <p className="text-gray-400">
              Official Government Platform for Convoy Management and Approval
              System
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2 text-gray-400">
              <li>
                <Link to="/" className="hover:text-white">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/register" className="hover:text-white">
                  Register
                </Link>
              </li>
              <li>
                <Link to="/login" className="hover:text-white">
                  Login
                </Link>
              </li>
              {/* <li>
                <a href="#" className="hover:text-white">
                  Help Center
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white">
                  Terms of Service
                </a>
              </li> */}
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Contact</h3>
            <div className="space-y-2 text-gray-400">
              <div className="flex items-center space-x-2">
                <Phone className="h-4 w-4" />
                <span>+1 (555) 123-4567</span>
              </div>
              <div className="flex items-center space-x-2">
                <Mail className="h-4 w-4" />
                <span>support@convoyms.gov</span>
              </div>
              <div className="flex items-center space-x-2">
                <MapPin className="h-4 w-4" />
                <span>
                  Jirkatang Check Post, NH-4 (Andaman Trunk Road), Jirkatang,
                  Ferrargunj, South Andaman District, Andaman & Nicobar Islands
                  744206, India
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-700 mt-8 pt-8 text-center text-gray-400">
          <p>
            Copyright &copy; 2025 A & N Police. All Right Reserved. <br></br>
            Designed, Developed, Hosted and Maintained by NIC, Andaman State Unit.
          </p>
        </div>
      </div>
    </footer>
  );
}
