import React, { useState, ReactNode } from "react";
import { ChevronLeft } from "lucide-react";
import { usePathname } from "next/navigation";

type AccordionProps = {
  icon: ReactNode;
  title: string;
  children: ReactNode;
  isExpanded: boolean;
};

const Accordion = ({ icon, title, children, isExpanded }: AccordionProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  const childArray = React.Children.toArray(children);

  const isActive = childArray.some(
    (child) =>
      React.isValidElement(child) &&
      "href" in child.props &&
      child.props.href === pathname
  );

  return (
    <div className="rounded-lg overflow-hidden">
      <button
        className={`w-full flex items-center gap-4 px-3 py-2 transition-all duration-300 ease-in-out ${
          isActive ? "bg-blue-600 text-white" : "hover:bg-gray-200"
        }`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className={`${isActive ? "text-white" : "text-gray-600"}`}>
          {icon}
        </div>
        <span
          className={`flex-1 text-left ${isExpanded ? "block" : "hidden"} ${
            isActive ? "text-white" : "text-gray-600"
          }`}
        >
          {title}
        </span>
        <div
          className={`transform transition-all duration-300 ${
            isOpen ? "-rotate-90" : "rotate-0"
          }`}
        >
          <ChevronLeft size={20} />
        </div>
      </button>
      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          isOpen
            ? "max-h-96 opacity-100 translate-y-0"
            : "max-h-0 opacity-0 -translate-y-2"
        }`}
      >
        <div className="flex flex-col gap-3 pt-3">{children}</div>
      </div>
    </div>
  );
};

export { Accordion };
