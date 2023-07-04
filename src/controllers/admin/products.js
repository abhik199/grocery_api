const {
  productModel,
  productImgModel,
  categoryModel,
} = require("../../models/models");
const customErrorHandler = require("../../../config/customErrorHandler");
const { Op } = require("sequelize");
const path = require("path");
const fs = require("fs");

exports.createProducts = async (req, res, next) => {
  const { name, price, brand, discount_price, categoryId, tag, stock } =
    req.body;

  if (!name || !price || !discount_price || !brand || !stock || !categoryId) {
    return next(customErrorHandler.requiredField());
  }
  console.log(categoryId);

  try {
    const selling_price = price;
    const discounted_price = discount_price;
    const discounted_percentage =
      ((selling_price - discounted_price) / selling_price) * 100;

    const product = await productModel.create({
      ...req.body,
      discount_percentage: discounted_percentage,
    });

    if (!product) {
      return res.status(400).json({
        status: false,
        message: "Failed to create product",
      });
    }

    if (req.files !== undefined && req.files.length > 0) {
      const imageFiles = req.files;

      try {
        const productImages = [];
        for (let i = 0; i < imageFiles.length; i++) {
          const imagePath = `${imageFiles[i].filename}`;
          await productImgModel.create({
            productId: product.id,
            images: imagePath,
          });
          productImages.push(imagePath);
        }

        await product.update({
          thumbnail: productImages[0],
        });
      } catch (error) {
        const fileNames = imageFiles.map((img) => {
          return img.filename;
        });
        const folderPath = path.join(process.cwd(), "public/product");
        fileNames.forEach((fileName) => {
          const filePath = path.join(folderPath, fileName);
          fs.unlink(filePath, (error) => {
            if (error) {
              console.log(`Failed to delete: ${error.message}`);
            }
          });
        });
      }
    }

    res.status(201).json({
      status: true,
      message: "Product created successfully",
    });
  } catch (error) {
    return next(error);
  }
};

exports.fetchAllProducts = async (req, res, next) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 5;
    const offset = (page - 1) * limit;

    const { name } = req.query;

    const whereCondition = {};

    if (name) {
      whereCondition.name = { [Op.like]: `%${name}%` };
    }

    const { count, rows: products } = await productModel.findAndCountAll({
      where: whereCondition,
      attributes: {
        exclude: ["createdAt", "updatedAt"],
      },
      include: [
        {
          model: categoryModel,
          attributes: { exclude: ["createdAt", "updatedAt"] },
        },
      ],
      offset: offset,
      limit: limit,
    });

    const totalCount = await productModel.count();

    if (count === 0) {
      return res.status(404).json({
        status: false,
        message: "Product not found",
      });
    }

    const totalPages = Math.ceil(totalCount / limit);

    return res.status(200).json({
      status: true,
      message: "Products retrieved successfully.",
      data: products,
      totalPages,
      totalItems: totalCount,
      currentPage: page,
    });
  } catch (error) {
    return next(error);
  }
};

exports.fetchProductById = async (req, res, next) => {
  const { id } = req.params;
  if (!id) {
    return res
      .status(400)
      .json({ status: false, message: "product id required" });
  }

  try {
    const product = await productModel.findOne({
      attributes: {
        exclude: ["createdAt", "updatedAt"],
      },
      where: { id: id },
      include: [
        {
          model: categoryModel,
          attributes: { exclude: ["createdAt", "updatedAt"] },
        },
        {
          model: productImgModel,
          attributes: { exclude: ["createdAt", "updatedAt"] },
        },
      ],
    });
    if (!product) {
      return res
        .status(400)
        .json({ status: false, message: "product not found" });
    }
    return res.status(200).json({ status: false, product });
  } catch (error) {
    return next(error);
  }
};

exports.deleteProduct = async (req, res, next) => {
  const id = req.params.id;
  if (!id) {
    return res
      .status(400)
      .json({ status: false, message: "product id required" });
  }
  try {
    // delete in locally
    const productId = await productModel.findOne({ where: { id: id } });
    if (!productId) {
      return res
        .status(400)
        .json({ status: false, message: "Product id wrong" });
    }
    const findImg = await productImgModel.findAll({
      where: { productId: productId.id },
      attributes: {
        exclude: ["createdAt", "updatedAt"],
      },
    });
    // return res.send(findImg);
    if (findImg.length === 0 && String(productId.id)) {
      const delete_img = await productModel.destroy({ where: { id: id } });
      if (!delete_img) {
        return res
          .status(400)
          .json({ status: false, message: "Failed to delete" });
      }
      return res
        .status(200)
        .json({ status: true, message: "delete successfully" });
    }
    const fileNames = findImg.map((img) => {
      return img.images;
    });
    console.log(fileNames);
    const folderPath = path.join(process.cwd(), "public/product");
    fileNames.forEach((fileName) => {
      const filePath = path.join(folderPath, fileName);
      fs.unlink(filePath, (error) => {
        if (error) {
          console.log(`Failed to delete: ${error.message}`);
        }
      });
    });
    // delete image in database
    await productImgModel.destroy({ where: { productId: id } });
    // delete all product
    const delete_product = await productModel.destroy({ where: { id: id } });

    if (!delete_product) {
      return res
        .status(400)
        .json({ status: false, message: "Product Delete failed" });
    }
    return res
      .status(200)
      .json({ status: true, message: "Product Delete successfully" });
  } catch (error) {
    return next(error);
  }
};

exports.updateProduct = async (req, res, next) => {
  const { id } = req.params;
  if (!id) {
    return res
      .status(400)
      .json({ status: false, message: "product id required" });
  }
  const [count, updatedRows] = await productModel.update(
    { ...req.body },
    { where: { id: id }, returning: true }
  );

  if (count === 0) {
    return res.status(400).json({ status: false, message: "Update failed" });
  }
  try {
  } catch (error) {
    return next(error);
  }
};
