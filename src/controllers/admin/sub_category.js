const path = require("path");
const fs = require("fs");
const joi = require("joi");

const {
  subcategoryModel,
  categoryModel,
  categorySUbCategoryModels,
} = require("../../models/models");

exports.createSubcategory = async (req, res, next) => {
  const subcategorySchema = joi.object({
    categoryId: joi.number().required(),
    subcategory: joi.string().required(),
  });
  const { error } = subcategorySchema.validate(req.body);

  if (error) {
    return next(error);
  }
  const sub_category = await subcategoryModel.findAll({
    where: {
      subcategory: req.body.subcategory,
    },
  });

  if (sub_category.length !== 0) {
    return res
      .status(400)
      .json({ status: false, message: "Duplicate subcategory is not allowed" });
  }
  const category_id = await categoryModel.findAll({
    where: { id: req.body.categoryId },
  });

  if (category_id.length === 0) {
    return res.status(400).json({ status: false, message: "Invalid category" });
  }

  try {
    const add_subCategory = await subcategoryModel.create({
      subcategory: req.body.subcategory,
      categoryId: req.body.categoryId,
    });
    if (!add_subCategory || add_subCategory.length === 0) {
      res.status(400).json({
        status: false,
        message: "SubCategory create failed",
      });
    }
    res.status(201).json({
      status: true,
      message: "sub category create successfully",
    });
    await categorySUbCategoryModels.create({
      categoryId: req.body.categoryId,
      subcategoryId: add_subCategory.id,
    });

    const subcategoryCount = await subcategoryModel.count({
      where: { categoryId: req.body.categoryId },
    });

    await categoryModel.update(
      { items: subcategoryCount },
      { where: { id: req.body.categoryId }, returning: true }
    );

    // Image Upload
    if (req.file !== undefined) {
      const image_url = `${req.file.filename}`;
      try {
        await subcategoryModel.update(
          {
            subcategory_images: image_url,
          },
          {
            where: {
              id: add_subCategory.id,
            },
            returning: true,
          }
        );
      } catch (error) {
        const folderPath = path.join(process.cwd(), "public/subcategory");
        const filePath = path.join(folderPath, image_url);
        fs.unlink(filePath, (error) => {
          if (error) {
            console.log(`Failed to delete: ${error.message}`);
          }
        });
      }
    }
  } catch (error) {
    return next(error);
  }
};

exports.fetchSubCategoryByAdmin = async (req, res, next) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 5;
    const offset = (page - 1) * limit;
    const { name, id } = req.query;
    const whereCondition = {};
    if (subcategory && id) {
      whereCondition[Op.and] = [
        { subcategory: { [Op.like]: `%${subcategory}%` } },
        { id: { [Op.eq]: id } },
      ];
    } else if (subcategory) {
      whereCondition.subcategory = { [Op.like]: `%${subcategory}%` };
    } else if (id) {
      whereCondition.id = { [Op.eq]: id };
    }
    const subcategory = await categoryModel.findAll({
      where: whereCondition,
      attributes: { exclude: ["createdAt", "updatedAt"] },
      offset: offset,
      limit: limit,
    });
    if (subcategory.length === 0) {
      return res
        .status(404)
        .json({ status: false, message: "subcategory not found" });
    }
    const totalCount = await productModel.count();
    const totalPages = Math.ceil(totalCount / limit);
    return res.status(200).json({
      status: true,
      subcategory,
      totalPages,
      totalItems: totalCount,
      currentPage: page,
    });
  } catch (error) {
    return next(error);
  }
};
// fetch Category by Id only access admin
exports.fetchSubCategoryById = async (req, res, next) => {
  const id = req.params.id;
  if (!id) {
    return res.status(400).json({ status: false, message: "Id required" });
  }
  try {
    const subcategoryId = await subcategoryModel.findOne({ where: { id: id } });
    if (!subcategoryId) {
      return res
        .status(404)
        .json({ status: false, message: "subcategory  id wrong" });
    }
    const subcategory = await subcategoryModel.findOne({
      where: { id: subcategoryId.id },
    });
    if (subcategory.length === 0) {
      return res
        .status(404)
        .json({ status: false, message: "subcategory not found" });
    }
    return res.status(200).json({ status: true, subcategory });
  } catch (error) {
    return next(error);
  }
};

exports.deleteSubCategory = async (req, res, next) => {
  const id = req.params.id;
  if (!id) {
    return res.status(400).json({ status: false, message: "Id required" });
  }
  try {
  } catch (error) {
    return next(error);
  }
};

exports.updateSubCategory = async (req, res, next) => {
  try {
  } catch (error) {
    return next(error);
  }
};
