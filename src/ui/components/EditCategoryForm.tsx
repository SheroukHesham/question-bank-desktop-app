import type { ICategory, ISubCategory } from "@/shared/interfaces";
import { Button } from "./ui/button";
import { CheckIcon, Pen, Plus, X } from "lucide-react";
import { Input } from "./ui/input";
import { useEffect, useState, type Dispatch } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import {
  categorySchema,
  type CategoryFormValues,
  type SubcategoryFormValues,
} from "../validation";
import { Label } from "./ui/label";
import UpdateSubcategoryEntry from "./UpdateSubcategoryEntry";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import SubcategoryAddForm from "./SubcategoryAddForm";
import { Alert } from "./Alert";
import { useNavigate } from "react-router-dom";
import { useNavigationGuard } from "../context/NavigationGuardContext";

//todo:fix on error message in toast

interface IProps {
  category: ICategory;
  subcategories: ISubCategory[];
  setEditMode: Dispatch<React.SetStateAction<boolean>>;
}

const EditCategoryForm = ({ category, subcategories, setEditMode }: IProps) => {
  const [editCategoryName, setEditCategoryName] = useState(false);
  const [addNewSub, setAddNewSub] = useState(false);
  const [subFormDirty, setSubFormDirty] = useState(false);

  const {
    setIsBlocked,
    requestNavigation,
    pendingNavigation,
    confirmNavigation,
    cancelNavigation,
  } = useNavigationGuard();

  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const {
    register,
    reset,
    handleSubmit,
    setFocus,
    formState: { errors },
  } = useForm<CategoryFormValues>({
    resolver: yupResolver(categorySchema),
    defaultValues: { name: category.name as string },
  });

  useEffect(() => {
    if (editCategoryName) {
      setFocus("name");
    }
  }, [editCategoryName, setFocus]);

  useEffect(() => {
    setIsBlocked(editCategoryName || addNewSub || subFormDirty);
  }, [editCategoryName, addNewSub, setIsBlocked, subFormDirty]);

  const updateCategory = useMutation({
    mutationFn: (category: ICategory) =>
      window.electron.category.updateCategory(category),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["categories", "getGroupedSubCat"],
      });
      queryClient.invalidateQueries({
        queryKey: ["categories", "byId", category._id],
      });
      toast.success("Topic Name Updated Successfully", {
        position: "top-center",
        style: {
          justifyContent: "center",
          color: "green",
          fontSize: "16px",
        },
      });
    },
    onError: (error) => {
      reset();
      toast.error("Error Updating Topic Name", {
        description: error.message,
        position: "top-center",
        style: {
          justifyContent: "center",
          color: "crimson",
          fontSize: "16px",
        },
      });
    },
  });

  const onSubmit = (data: CategoryFormValues) => {
    setEditCategoryName(false);
    if (data.name.toLowerCase() === category.name.toLowerCase()) return;
    updateCategory.mutate({ ...category, name: data.name });
  };

  const addSubcategory = useMutation({
    mutationFn: ({ name, categoryId }: { name: string; categoryId: number }) =>
      window.electron.subcategory.createSubcategory(name, categoryId),
    onSuccess: () => {
      toast.success("Subtopic Added Successfully", {
        position: "top-center",
        style: {
          justifyContent: "center",
          color: "green",
          fontSize: "16px",
        },
      });
      queryClient.invalidateQueries({
        queryKey: ["subcategories", "findByCategoryId"],
      });
      queryClient.invalidateQueries({
        queryKey: ["categories", "getGroupedSubCat"],
      });

      setAddNewSub(false);
    },
  });

  const onAddSubmit = (data: SubcategoryFormValues) => {
    addSubcategory.mutate({ name: data.name, categoryId: category._id });
  };

  const deleteCategory = useMutation({
    mutationFn: ({ id }: { id: number }) =>
      window.electron.category.deleteCategory(id),
    onSuccess: () => {
      toast.success("Topic Deleted Successfully", {
        position: "top-center",
        style: {
          justifyContent: "center",
          color: "green",
          fontSize: "16px",
        },
      });
      queryClient.invalidateQueries({
        queryKey: ["subcategories", "findByCategoryId"],
      });
      queryClient.invalidateQueries({
        queryKey: ["categories", "getGroupedSubCat"],
      });
      navigate(-1);
    },
    onError: () => {
      toast.error("Error Deleting Topic", {
        position: "top-center",
        style: {
          justifyContent: "center",
          color: "crimson",
          fontSize: "16px",
        },
      });
    },
  });

  const onDeleteCategory = () => {
    deleteCategory.mutate({ id: category._id });
  };

  const renderSubcategories = subcategories.map((subcategory) => {
    return (
      <div className="flex gap-5" key={subcategory._id}>
        <UpdateSubcategoryEntry
          subcategory={subcategory}
          setSubFormDirty={setSubFormDirty}
        />
      </div>
    );
  });

  return (
    <div className="w-full">
      <div className="w-full flex justify-end mb-5">
        <div className="flex items-center gap-5">
          <Button
            variant={"secondary"}
            onClick={() => {
              setEditMode(false);
              reset();
              setIsBlocked(false);
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={() => {
              if (!editCategoryName && !addNewSub && !subFormDirty)
                setEditMode(false);
              else
                requestNavigation(() => navigate(`/category/${category._id}`));
            }}
          >
            Done
          </Button>
        </div>
      </div>
      <form onSubmit={handleSubmit(onSubmit)} className="w-full mb-10">
        <div className="flex w-full justify-between">
          <div className="flex  flex-col gap-5">
            <Label className="text-5xl">Topic</Label>
            <div className="flex gap-5 ">
              <div className="flex flex-col w-full gap-y-3">
                <Input
                  {...register("name")}
                  className="text-xl font-semibold"
                  disabled={!editCategoryName}
                />
                {errors.name && (
                  <p className="text-destructive text-sm font-semibold">
                    {errors.name.message}
                  </p>
                )}
              </div>
              {editCategoryName ? (
                <div className="flex gap-5">
                  <Button type="submit">
                    <CheckIcon size={"20px"} />
                  </Button>
                  <Button
                    variant={"secondary"}
                    type="button"
                    onClick={() => {
                      setEditCategoryName(false);
                      reset();
                    }}
                  >
                    <X />
                  </Button>
                </div>
              ) : (
                <Button
                  variant={"outline"}
                  type="button"
                  onClick={() => {
                    setEditCategoryName(true);
                  }}
                >
                  <Pen />
                </Button>
              )}
            </div>
          </div>
        </div>
        <Alert
          title="Save Changes?"
          description="If you navigate to another page without saving your changes they will be lost."
          submitText="Cancel"
          cancelText="Don't Save"
          open={pendingNavigation !== null}
          onSubmit={cancelNavigation}
          onCancel={() => {
            reset();
            setEditCategoryName(false);
            setAddNewSub(false);
            setSubFormDirty(false);
            setEditMode(false);
            confirmNavigation();
          }}
          variant="default"
        />
      </form>

      <div className="flex flex-col gap-10">
        <div className="flex w-full justify-between ">
          <h1 className="text-4xl font-semibold">Subtopics</h1>
          <Button
            variant={"secondary"}
            onClick={() => {
              setAddNewSub(true);
            }}
          >
            <Plus /> Create New Subtopic
          </Button>
        </div>
        <div className="flex flex-col gap-5">
          {addNewSub && (
            <SubcategoryAddForm
              onSaved={onAddSubmit}
              onCancel={() => {
                setAddNewSub(false);
              }}
            />
          )}
          {renderSubcategories}
        </div>
        <div className="flex w-full justify-center items-baseline my-5">
          <Alert
            title="Are You Sure You Want to Delete Topic?"
            description="Deleting this topic will permanently remove it from the system. You will not be able to delete this topic if it has questions assigned to it in order to avoid accidentally losing questions."
            variant="destructive"
            buttonChildren={<span>Delete Topic</span>}
            submitText="Delete"
            onSubmit={() => onDeleteCategory()}
          />
        </div>
      </div>
    </div>
  );
};

export default EditCategoryForm;
