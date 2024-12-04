type AlertProps = {
  children: React.ReactNode;
};
const Alert = ({ children }: AlertProps) => {
  return (
    <div className="p-2 rounded bg-red-200 grid col-span-2">{children}</div>
  );
};
export { Alert };
