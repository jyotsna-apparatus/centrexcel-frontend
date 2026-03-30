import type React from "react";

const PageHeader = ({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children?: React.ReactNode;
}) => {
  return (
    <header className="mb-4 flex flex-col gap-4 border-b border-cs-primary pb-4 sm:flex-row sm:items-end sm:justify-between sm:gap-6">
      <div className="min-w-0 flex flex-col gap-1">
        <h1 className="h3 text-cs-heading">{title}</h1>
        <p className="p1 text-cs-text text-pretty">{description}</p>
      </div>
      {children ? (
        <div className="flex shrink-0 flex-wrap gap-2 sm:justify-end">
          {children}
        </div>
      ) : null}
    </header>
  );
};

export default PageHeader;
