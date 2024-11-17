import { getCompanies } from "@/api/apiCompanies";
import { addNewJob } from "@/api/apiJobs";
import AddCompanyDrawer from "@/components/AddCompanyDrawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import useFetch from "@/hooks/use-fetch";
import { useUser } from "@clerk/clerk-react";
import { zodResolver } from "@hookform/resolvers/zod";
import MDEditor from "@uiw/react-md-editor";
import { State } from "country-state-city";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { Navigate, useNavigate } from "react-router-dom";
import { BarLoader } from "react-spinners";
import { z } from "zod"


const schema = z.object({
  title: z.string().min(1, {message: "Title is required"}),
  description: z.string().min(1, {message: "Description is required"}),
  location: z.string().min(1, {message: "Select a location"}),
  company_id: z.string().min(1, {message: "Select or add a company"}),
  requirements: z.string().min(1, {message: "Requirements are can not be empty"}),
});


const PostJob = () => {
  const {isLoaded, user} = useUser();
  const navigate = useNavigate();

  const {register, control, handleSubmit, formState:{errors}} = useForm({
    defaultValue: {
      location: "",
      company_id: "",
      requirements:  ""
    },
    resolver: zodResolver(schema)
  });

  const {fn: fnCompanies, data: companies, loading: loadingCompanies} = useFetch(getCompanies);
  
  useEffect(() => {
    if(isLoaded) fnCompanies();
  }, [isLoaded]);

  const {
    loading: loadingCreateJob,
    error: errorCreateJob,
    data: dataCreateJob,
    fn: fnCreateJob,
  } = useFetch(addNewJob);

  const onSubmit = (data) => {
    fnCreateJob({
      ...data,
      recruiter_id: user.id,
      isOpen: true
    })
  }

  useEffect(()=>{
    if(dataCreateJob?.length>0) {
      navigate("/jobs")
    }
  }, [loadingCreateJob])

  if(!isLoaded || loadingCompanies){
    return <BarLoader className="mb-4" width={'100%'} color="#36d7b7"/>
  }

  if(user?.unsafeMetadata?.role !== "recruiter"){
    return <Navigate to="/jobs" />
  }

  return (
    <>
      <h2 className="gradient-title font-extrabold py-3 text-4xl sm:text-6xl text-center pb-8">Post a Job</h2>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 p-4 pb-0">
        <div>
        <Input placeholder="Job Title" {...register("title")} />
        {errors.title && <p className="text-red-500">{errors.title.message}</p>}
        </div>
 
        <div>
        <Textarea placeholder="Job Description" {...register("description")} />
        {errors.description && <p className="text-red-500">{errors.description.message}</p>}
        </div> 

        <div className="flex gap-4 items-center">
          <div className="flex-grow">
          <Controller
            name="location"
            control={control}
            render={({field}) => (        
          
              <Select 
                value={field.value} 
                onValueChange={field.onChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Filter by location" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {State.getStatesOfCountry("BD").map(({name}) => {
                      return(
                        <SelectItem key={name} value={name}>{name}</SelectItem>
                      );           
                    })}
                  </SelectGroup>
                </SelectContent>
              </Select>
              )}
            />{errors.location && <p className="text-red-500">{errors.location.message}</p>}</div>

          <div className="flex-grow">
            <Controller
            name="company_id"
            control={control}
            render={({field}) => (
            <Select 
            value={field.value} onValueChange={field.onChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="Filter by Company" >
                  {field.value ? companies?.find((com) => com.id === Number(field.value))?.name : "Company"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {
                    companies?.map(({name, id}) => {
                      return(
                        <SelectItem key={name} value={id}>{name}</SelectItem>                  
                      );                  
                    })
                  }              
                </SelectGroup>
              </SelectContent>
            </Select>     
            )}
          />{errors.company_id && <p className="text-red-500">{errors.company_id.message}</p>}
          </div>
          
          <AddCompanyDrawer fetchCompanies={fnCompanies}/>
        </div>
        
        
        <Controller
            name="requirements"
            control={control}
            render={({field}) => ( 

            <MDEditor value={field.value} onChange={field.onChange}/> 
              
          )} 
        />
        {errors.requirements && <p className="text-red-500">{errors.requirements.message}</p>}

        {errorCreateJob?.message && <p className="text-red-500">{errorCreateJob?.message}</p>}

        {loadingCreateJob && <BarLoader className="mb-4" width={'100%'} color="#36d7b7"/>}  
        <Button type="submit" variant="blue" size="lg" className="mt-2">Post Job</Button>
      </form>
    </>
  )
}

export default PostJob