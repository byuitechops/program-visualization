# program-visualization
An attempt to visualize an entire program (degree logic, requisite logic, catalog changes)

[Hand drawn prototype](/prototype.pdf)

[Alternative model](/bubbleit/index.html) *(straight lines and new algorithm)*

## Models
[Accounting](/backtothestart/programs/accounting.html)

[Art Education](/backtothestart/programs/arted.html)

[Business Management](/backtothestart/programs/business.html)

[Computer Science](/backtothestart/programs/computerscience.html)

[Construction Management](/backtothestart/programs/construction.html)

[Data Science](/backtothestart/programs/datascience.html)

[English](/backtothestart/programs/construction.html)

## Use Cases

### All
- Will recognize the program
- Will understand the complexity
- Will better understand how the program is built
- Can work through a couple of cases to see student's perspective

### Advising
- Can quickly find/understand all of options a student has

### Instructors
- Can know all of the possible paths students have taken to get to their course

### Department Heads
- Can easily compare against other programs from other departments

### Administration
- Find bottle necks, potential problems

## Complexity to show
  
- Program Logic
  - ANDs
  - ORs
  - Credit counts
- Requisite Logic
  - ANDs
  - ORs
  - Test outs
  - Over so many credits (ex. must have taken at least 60 credits)
- Changes between Catalog Years
- Potential Double counting (not allowing a course in two program blocks)
- Repeatable courses
- Hidden requisites
- 120 credit limit
- Equivalent Courses?

#### Questions for Advising
 - Do concurrent requisites ever have Or's?
 - Which course is in the most amount of programs? 
    (to know how many we should be able to display)

#### Questions for Designers
 - Should andsep be different than lanesep?
 - Should I curve the edge corners? 
 - Should highlighting a partial AND edge light up it's portion?
