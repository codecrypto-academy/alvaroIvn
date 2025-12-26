/**
 * Card Component
 * Contenedor con estilo de tarjeta
 */

import React from "react";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: boolean;
}

export function Card({ children, className = "", padding = true }: CardProps) {
  return (
    <div
      className={`bg-white rounded-lg border border-gray-200 shadow-sm ${
        padding ? "p-6" : ""
      } ${className}`}
    >
      {children}
    </div>
  );
}

interface CardHeaderProps {
  children: React.ReactNode;
  className?: string;
}

export function CardHeader({ children, className = "" }: CardHeaderProps) {
  return <div className={`mb-4 ${className}`}>{children}</div>;
}

interface CardTitleProps {
  children: React.ReactNode;
  className?: string;
}

export function CardTitle({ children, className = "" }: CardTitleProps) {
  return <h3 className={`text-xl font-bold text-gray-900 ${className}`}>{children}</h3>;
}

interface CardContentProps {
  children: React.ReactNode;
  className?: string;
  padding?: boolean;
}

export function CardContent({ children, className = "", padding = true }: CardContentProps) {
  return <div className={`${padding ? "p-6" : ""} ${className}`}>{children}</div>;
}