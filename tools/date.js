


export const getDayString = () => {
  // Use System timeZone by default: 
  // '24/07/2025, 22:16:04' => "2025-07-24"
  const regex = /(\d+)\/(\d+)\/(\d+)/g
  const parts = regex.exec(new Date().toLocaleString("en-GB"))
  const dayString = `${parts[3]}-${parts[2]}-${parts[1]}`
  return dayString
}