import React from "react";
import { Outlet } from "react-router-dom";
import TopNav from "../components/ui/TopNav";

const AssessmentLayout = () => {

    return (

        <div className="min-h-screen bg-background">

            <TopNav />

            <main className="container mx-auto px-4 py-6">

                <Outlet />

            </main>

        </div>

    );

};

export default AssessmentLayout;