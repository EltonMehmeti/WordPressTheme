<?php if ( have_posts() ) : while ( have_posts() ) : the_post(); ?>

<head>
    <style>
        .card{

            margin: 20px 0;
            box-sizing: border-box;
        }
        img{

            margin-right: 20px;
        }
    </style>
</head>

<div class="card">

    <div class="card-body d-flex justify-content-center align-items-center" style="background-color:#ff5f6d ;" 

    > 




         <?php if(has_post_thumbnail()):?>

                     <img src="<?php the_post_thumbnail_url('blog-small');?>" alt="<?php the_title();?>" class="img-fluid mb-3 img-thumbnail mr-4">

                 <?php endif;?>

             <div class="blog-content"> 

                 <h3><?php the_title();?></h3>

                 

                 <a href="<?php the_permalink(); ?>" class="btn btn-primary">Read more</a>

             </div>

    </div>

</div>




            <?php endwhile; else: endif; ?>