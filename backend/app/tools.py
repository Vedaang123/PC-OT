from typing import List
from langchain_core.tools import tool
from pydantic import BaseModel, Field

class CalculateAverage(BaseModel):
    """Calculate the average of a list of numbers."""
    numbers: List[float] = Field(
        ..., 
        description="A list of numerical values extracted from the context that need to be averaged."
    )

@tool(args_schema=CalculateAverage)
def calculate_average_experience(numbers: List[float]) -> str:
    """Calculates the average experience from a list of years."""
    if not numbers:
        return "Tool Error: No numerical data was provided."
    
    valid_numbers = [n for n in numbers if isinstance(n, (int, float))]
    
    if not valid_numbers:
        return "Tool Error: The input list did not contain valid numbers."
        
    avg = sum(valid_numbers) / len(valid_numbers)
    return f"The accurate calculated average is {avg:.2f} years, based on {len(valid_numbers)} data points: {valid_numbers}"